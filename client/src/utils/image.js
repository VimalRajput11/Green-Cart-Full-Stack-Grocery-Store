// Ask Cloudinary for a resized, auto-format, auto-quality version of an image.
// Original product photos can be several MB; cards only need a few hundred pixels.
export const optimizeImg = (url, width = 400) => {
  if (typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  const [base, rest] = url.split('/upload/');
  // Skip if the URL already carries a transformation
  if (/^[a-z]{1,3}_[^/]+\//.test(rest) && !/^v\d+\//.test(rest)) return url;
  return `${base}/upload/f_auto,q_auto,c_limit,w_${width}/${rest}`;
};
