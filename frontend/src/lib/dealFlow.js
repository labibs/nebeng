const REQUEST_POST_TYPES = new Set([
  "nitip_bawakan",
  "nitip_belikan",
  "cari_boncengan",
  "tukang",
])

function getOwnerId(postInfo) {
  return postInfo?.clerk_user_id || postInfo?.user_id || null
}

function toIsoLikeLocalDate(value) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().replace("T", " ").split(".")[0] + "+07"
  }

  return date.toISOString().replace("T", " ").split(".")[0] + "+07"
}

function formatLocationFromPost(prefixLat, prefixLng, fallbackLabel) {
  if (prefixLat == null || prefixLng == null) return fallbackLabel || "TBD"
  return `${prefixLat},${prefixLng}, ${fallbackLabel || "Lokasi"}`
}

function normalizeDealPayload(payload) {
  if (!payload) return null

  const carrierId = payload.carrier_id || payload.carrierId || null
  const depositorId = payload.depositor_id || payload.depositorId || null

  return {
    ...payload,
    carrier_id: carrierId,
    depositor_id: depositorId,
  }
}

export function inferDealRoles(postInfo, currentUserId) {
  const ownerId = getOwnerId(postInfo)
  if (!ownerId || !currentUserId) {
    console.log("[dealFlow] inferDealRoles blocked", {
      postId: postInfo?.id,
      postType: postInfo?.type,
      ownerId,
      currentUserId,
    })
    return null
  }

  const requesterPost = REQUEST_POST_TYPES.has(postInfo?.type)

  console.log("[dealFlow] inferDealRoles", {
    postId: postInfo?.id,
    postType: postInfo?.type,
    ownerId,
    currentUserId,
    requesterPost,
  })

  return requesterPost
    ? { carrierId: currentUserId, depositorId: ownerId }
    : { carrierId: ownerId, depositorId: currentUserId }
}

export function buildDealDefaultsFromPost(postInfo) {
  const fromLabel =
    postInfo?.from_city || postInfo?.location?.address || "Lokasi Asal"
  const toLabel = postInfo?.to_city || postInfo?.location?.address || "Lokasi Tujuan"

  return {
    agreed_fee: Number(postInfo?.fee || 0),
    item_fee: Number(postInfo?.price || 0),
    status: "pending",
    pickup_location: formatLocationFromPost(
      postInfo?.from_lat,
      postInfo?.from_lng,
      fromLabel,
    ),
    delivery_location: formatLocationFromPost(
      postInfo?.to_lat,
      postInfo?.to_lng,
      toLabel,
    ),
    pickup_datetime: toIsoLikeLocalDate(postInfo?.travel_date),
    item_description: postInfo?.item_description || postInfo?.description || "TBD",
    item_photos: postInfo?.item_photo ? [postInfo.item_photo] : [],
    notes: postInfo?.description || "",
    delivery_status: "draft",
  }
}

export function buildDirectDealPayload(postInfo, currentUserId) {
  const roles = inferDealRoles(postInfo, currentUserId)
  if (!roles) {
    console.log("[dealFlow] buildDirectDealPayload no roles", {
      postId: postInfo?.id,
      currentUserId,
    })
    return null
  }

  const payload = {
    ...roles,
    post_id: postInfo?.id,
    ...buildDealDefaultsFromPost(postInfo),
  }

  console.log("[dealFlow] buildDirectDealPayload", {
    postId: postInfo?.id,
    payload,
  })

  return payload
}

export async function createOrReuseDealFromPayload(apiFetch, payload) {
  const normalizedPayload = normalizeDealPayload(payload)

  if (
    !normalizedPayload?.post_id ||
    !normalizedPayload?.carrier_id ||
    !normalizedPayload?.depositor_id
  ) {
    console.log("[dealFlow] createOrReuseDealFromPayload invalid payload", payload)
    return null
  }

  console.log("[dealFlow] createOrReuseDealFromPayload request", normalizedPayload)

  try {
    const result = await apiFetch("/deals/from-post", {
      method: "POST",
      body: JSON.stringify(normalizedPayload),
    })

    console.log("[dealFlow] createOrReuseDealFromPayload response", result)
    return result
  } catch (error) {
    console.error("[dealFlow] createOrReuseDealFromPayload failed", {
      message: error?.message,
      status: error?.status,
      data: error?.data,
      payload: normalizedPayload,
    })
    throw error
  }
}

export async function createOrReuseDealForPost(apiFetch, postInfo, currentUserId, messageId = null) {
  if (!postInfo?.id || !currentUserId) return null

  const payload = buildDirectDealPayload(postInfo, currentUserId)
  if (!payload) return null

  const created = await createOrReuseDealFromPayload(apiFetch, {
    ...payload,
    message_id: messageId,
  })

  return created
}
