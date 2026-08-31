const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .slice(0, 180);

function paginate(page = 1, perPage = 24) {
  page = Math.max(1, parseInt(page, 10) || 1);
  perPage = Math.min(100, Math.max(1, parseInt(perPage, 10) || 24));
  return { page, perPage, offset: (page - 1) * perPage };
}

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    fullName: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email,
    avatar: u.avatar,
    bio: u.bio,
    city: u.city,
    language: u.language,
    role: u.role,
    renterEnabled: u.renter_enabled,
    ownerEnabled: u.owner_enabled,
    businessAccount: u.business_account,
    emailVerified: u.email_verified,
    phoneVerified: u.phone_verified,
    identityVerified: u.identity_verified,
    businessVerified: u.business_verified,
    listingVerified: u.listing_verified,
    rating: Number(u.rating),
    reviewCount: u.review_count,
    completedRentals: u.completed_rentals,
    responseRate: Number(u.response_rate),
    responseTime: u.response_time,
    memberSince: u.created_at,
  };
}

function publicListing(row, opts = {}) {
  if (!row) return null;
  const detail = !!opts.detail;
  const out = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    categoryId: row.category_id,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    subcategoryId: row.subcategory_id,
    subcategorySlug: row.subcategory_slug,
    subcategoryName: row.subcategory_name,
    mainImage: row.main_image,
    gallery: row.gallery || [],
    status: row.status,
    verificationStatus: row.verification_status,
    featured: !!row.featured,
    promotionTier: row.promotion_tier,
    promotionUntil: row.promotion_until,
    isFavorite:
      opts.isFavorite !== undefined ? !!opts.isFavorite : row.is_favorite === true,
    rentedCount: row.rented_count ? Number(row.rented_count) : 0,
    currency: row.currency,
    priceHourly: row.price_hourly === null ? null : Number(row.price_hourly),
    priceDaily: row.price_daily === null ? null : Number(row.price_daily),
    priceWeekly: row.price_weekly === null ? null : Number(row.price_weekly),
    priceMonthly: row.price_monthly === null ? null : Number(row.price_monthly),
    minimumDuration: Number(row.minimum_duration),
    minimumDurationUnit: row.minimum_duration_unit,
    depositAmount: Number(row.deposit_amount || 0),
    cleaningFee: Number(row.cleaning_fee || 0),
    deliveryFee: Number(row.delivery_fee || 0),
    pickupFee: Number(row.pickup_fee || 0),
    extraFee: Number(row.extra_fee || 0),
    city: row.city,
    region: row.region,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    airportName: row.airport_name,
    airportDistance: Number(row.airport_distance || 0),
    locationPublic: !!row.location_public,
    pickupAvailable: !!row.pickup_available,
    deliveryAvailable: !!row.delivery_available,
    instantBooking: !!row.instant_booking,
    bookingRequired: !!row.booking_required,
    smokingAllowed: !!row.smoking_allowed,
    petsAllowed: !!row.pets_allowed,
    minAge: row.min_age,
    condition: row.condition,
    cancellationPolicy: row.cancellation_policy,
    phoneVisibility: !!row.phone_visibility,
    attributes: row.attributes || {},
    rating: row.rating === null ? 0 : Number(row.rating),
    reviewCount: row.review_count,
    viewCount: row.view_count,
    favoriteCount: row.favorite_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    owner: row.owner_id
      ? {
          id: row.owner_id,
          firstName: row.owner_first_name,
          lastName: row.owner_last_name,
          avatar: row.owner_avatar,
          rating: row.owner_rating === null ? 0 : Number(row.owner_rating),
          identityVerified: !!row.owner_identity_verified,
        }
      : null,
  };

  if (detail) {
    out.ownerProfile = {
      bio: row.owner_bio,
      city: row.owner_city,
      reviewCount: Number(row.owner_review_count || 0),
      responseRate: Number(row.owner_response_rate || 0),
      responseTime: Number(row.owner_response_time || 0),
      memberSince: row.owner_created_at,
      identityVerified: !!row.owner_identity_verified,
      businessVerified: !!row.owner_business_verified,
      listingVerified: !!row.owner_listing_verified,
    };
    out.usageRestrictions = row.usage_restrictions;
    out.conditionDescription = row.condition_description;
    out.seoTitle = row.seo_title;
    out.seoDescription = row.seo_description;
  }

  if (opts.distance != null && row.distance_m != null) {
    out.distanceKm = Math.round((Number(row.distance_m) / 1000) * 10) / 10;
  }

  return out;
}

module.exports = { slugify, paginate, publicUser, publicListing };