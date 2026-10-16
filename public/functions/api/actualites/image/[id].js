function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function onRequestGet({ env, params }) {
  if (!env.NEWS_DB || !env.NEWS_IMAGES) {
    return jsonResponse({ error: "Le stockage des actualités n’est pas configuré." }, 503);
  }

  const id = params.id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return jsonResponse({ error: "Image introuvable." }, 404);
  }

  const record = await env.NEWS_DB.prepare(
    "SELECT image_key, image_type FROM actualites WHERE id = ?",
  )
    .bind(id)
    .first();
  if (!record) {
    return jsonResponse({ error: "Image introuvable." }, 404);
  }

  const image = await env.NEWS_IMAGES.get(record.image_key);
  if (!image) {
    return jsonResponse({ error: "Image introuvable." }, 404);
  }

  return new Response(image.body, {
    headers: {
      "Content-Type": record.image_type,
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
