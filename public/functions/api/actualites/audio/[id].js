function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function onRequestGet({ request, env, params }) {
  if (!env.NEWS_DB || !env.NEWS_IMAGES) {
    return jsonResponse({ error: "Le stockage des actualités n’est pas configuré." }, 503);
  }

  const id = params.id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return jsonResponse({ error: "Fichier audio introuvable." }, 404);
  }

  const record = await env.NEWS_DB.prepare(
    "SELECT audio_key FROM actualites WHERE id = ?",
  )
    .bind(id)
    .first();
  if (!record?.audio_key) {
    return jsonResponse({ error: "Fichier audio introuvable." }, 404);
  }

  const audio = await env.NEWS_IMAGES.get(record.audio_key);
  if (!audio) {
    return jsonResponse({ error: "Fichier audio introuvable." }, 404);
  }

  const disposition = new URL(request.url).searchParams.has("inline")
    ? "inline"
    : "attachment";
  return new Response(audio.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Disposition": `${disposition}; filename="actualite-${id}.mp3"`,
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
