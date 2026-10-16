const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const MAX_TITLE_LENGTH = 20_000;
const MAX_SUBTITLE_LENGTH = 100_000;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function hasStorageBindings(env) {
  return env.NEWS_DB && env.NEWS_IMAGES;
}

function getImageType(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { extension: "png", contentType: "image/png" };
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { extension: "webp", contentType: "image/webp" };
  }
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return { extension: "gif", contentType: "image/gif" };
  }
  return null;
}

function isMp3(bytes) {
  const hasId3Header =
    bytes.length >= 3 &&
    bytes[0] === 0x49 &&
    bytes[1] === 0x44 &&
    bytes[2] === 0x33;
  const hasMpegFrameHeader =
    bytes.length >= 2 &&
    bytes[0] === 0xff &&
    (bytes[1] & 0xe0) === 0xe0;
  return hasId3Header || hasMpegFrameHeader;
}

export async function onRequestGet({ env }) {
  if (!hasStorageBindings(env)) {
    return jsonResponse({ error: "Le stockage des actualités n’est pas configuré." }, 503);
  }

  const { results } = await env.NEWS_DB.prepare(
    "SELECT id, title, subtitle, created_at, audio_key FROM actualites ORDER BY created_at DESC",
  ).all();

  return jsonResponse({
    news: results.map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      createdAt: item.created_at,
      imageUrl: `/api/actualites/image/${encodeURIComponent(item.id)}`,
      ...(item.audio_key
        ? { audioUrl: `/api/actualites/audio/${encodeURIComponent(item.id)}` }
        : {}),
    })),
  });
}

export async function onRequestPost({ request, env }) {
  if (!hasStorageBindings(env)) {
    return jsonResponse({ error: "Le stockage des actualités n’est pas configuré." }, 503);
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (contentLength > MAX_IMAGE_BYTES + MAX_AUDIO_BYTES + 1024 * 1024) {
    return jsonResponse({ error: "Le formulaire dépasse la taille maximale autorisée." }, 413);
  }

  if (!request.headers.get("Content-Type")?.includes("multipart/form-data")) {
    return jsonResponse({ error: "Le formulaire envoyé est invalide." }, 415);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return jsonResponse({ error: "Le formulaire envoyé est illisible." }, 400);
  }

  const rawTitle = form.get("title");
  const rawSubtitle = form.get("subtitle");
  const image = form.get("image");
  const audioField = form.get("audio");
  const audio = audioField instanceof File && !audioField.name ? null : audioField;

  if (typeof rawTitle !== "string" || typeof rawSubtitle !== "string") {
    return jsonResponse({ error: "Le titre et le sous-titre doivent être du texte." }, 400);
  }
  const title = rawTitle.trim();
  const subtitle = rawSubtitle.trim();
  if (!title || !subtitle) {
    return jsonResponse({ error: "Le titre et le sous-titre sont obligatoires." }, 400);
  }
  if (title.length > MAX_TITLE_LENGTH || subtitle.length > MAX_SUBTITLE_LENGTH) {
    return jsonResponse({ error: "Le titre ou le sous-titre dépasse la limite technique autorisée." }, 413);
  }
  if (!(image instanceof File) || image.size === 0) {
    return jsonResponse({ error: "Choisissez une image valide." }, 400);
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return jsonResponse({ error: "L’image doit peser 5 Mo maximum." }, 413);
  }

  const imageBytes = new Uint8Array(await image.arrayBuffer());
  const imageType = getImageType(imageBytes);
  if (!imageType) {
    return jsonResponse({ error: "L’image doit être au format JPG, PNG, WebP ou GIF." }, 415);
  }

  const id = crypto.randomUUID();
  if (audio && !(audio instanceof File)) {
    return jsonResponse({ error: "Le fichier audio envoyé est invalide." }, 400);
  }
  if (audio instanceof File && audio.size > MAX_AUDIO_BYTES) {
    return jsonResponse({ error: "Le fichier MP3 doit peser 15 Mo maximum." }, 413);
  }

  let audioBytes;
  let audioKey;
  if (audio instanceof File) {
    audioBytes = new Uint8Array(await audio.arrayBuffer());
    if (!audio.name.toLowerCase().endsWith(".mp3") || !isMp3(audioBytes)) {
      return jsonResponse({ error: "Le fichier audio doit être un MP3 valide." }, 415);
    }
    audioKey = `${id}.mp3`;
  }

  const imageKey = `${id}.${imageType.extension}`;
  const createdAt = new Date().toISOString();

  try {
    await env.NEWS_IMAGES.put(imageKey, imageBytes, {
      httpMetadata: {
        contentType: imageType.contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
    if (audioKey) {
      await env.NEWS_IMAGES.put(audioKey, audioBytes, {
        httpMetadata: {
          contentType: "audio/mpeg",
          cacheControl: "public, max-age=31536000, immutable",
        },
      });
    }
    await env.NEWS_DB.prepare(
      "INSERT INTO actualites (id, title, subtitle, image_key, image_type, audio_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(id, title, subtitle, imageKey, imageType.contentType, audioKey || null, createdAt)
      .run();
  } catch (error) {
    for (const key of [imageKey, audioKey].filter(Boolean)) {
      try {
        await env.NEWS_IMAGES.delete(key);
      } catch (cleanupError) {
        console.error(`Impossible de supprimer le fichier ${key} après l’échec de la publication.`, cleanupError);
      }
    }
    console.error("Impossible de publier l’actualité et ses fichiers.", error);
    return jsonResponse({ error: "Le serveur n’a pas pu enregistrer cette actualité." }, 500);
  }

  return jsonResponse(
    {
      news: {
        id,
        title,
        subtitle,
        createdAt,
        imageUrl: `/api/actualites/image/${encodeURIComponent(id)}`,
        ...(audioKey
          ? { audioUrl: `/api/actualites/audio/${encodeURIComponent(id)}` }
          : {}),
      },
    },
    201,
  );
}
