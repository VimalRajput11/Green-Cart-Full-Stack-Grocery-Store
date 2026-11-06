// Shared order-lifecycle helpers for customer, seller and rider screens.
// Keep in sync with server/utils/orderFlow.js

export const STATUS = {
  PLACED: 'Order Placed',
  PACKED: 'Packed',
  PICKED: 'Picked',
  OUT: 'Out for Delivery',
  ARRIVING: 'Arriving', // legacy
  REACHED: 'Reached Location',
  DELIVERED: 'Delivered',
  FAILED: 'Delivery Failed',
  CANCELLED: 'Cancelled',
};

export const PRE_PICKUP = [STATUS.PLACED, STATUS.PACKED];
export const IN_TRANSIT = [STATUS.PICKED, STATUS.OUT, STATUS.ARRIVING, STATUS.REACHED];
export const ACTIVE = [...PRE_PICKUP, ...IN_TRANSIT];
export const FINAL = [STATUS.DELIVERED, STATUS.FAILED, STATUS.CANCELLED];

// Customer-facing tracking steps
export const TRACK_STEPS = [
  { key: STATUS.PLACED, label: 'Order placed' },
  { key: STATUS.PACKED, label: 'Packed' },
  { key: STATUS.PICKED, label: 'Picked up' },
  { key: STATUS.OUT, label: 'On the way' },
  { key: STATUS.REACHED, label: 'Arrived' },
  { key: STATUS.DELIVERED, label: 'Delivered' },
];

export const stepIndex = (status) => {
  if (status === STATUS.ARRIVING) return 3;
  return TRACK_STEPS.findIndex((s) => s.key === status);
};

export const STATUS_STYLE = {
  [STATUS.PLACED]: 'bg-amber-50 text-amber-700 border-amber-200',
  [STATUS.PACKED]: 'bg-sky-50 text-sky-700 border-sky-200',
  [STATUS.PICKED]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  [STATUS.OUT]: 'bg-violet-50 text-violet-700 border-violet-200',
  [STATUS.ARRIVING]: 'bg-violet-50 text-violet-700 border-violet-200',
  [STATUS.REACHED]: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  [STATUS.DELIVERED]: 'bg-green-50 text-green-700 border-green-200',
  [STATUS.FAILED]: 'bg-orange-50 text-orange-700 border-orange-200',
  [STATUS.CANCELLED]: 'bg-red-50 text-red-700 border-red-200',
};

// What the customer sees as the headline for each status
export const CUSTOMER_HEADLINE = {
  [STATUS.PLACED]: 'Order received',
  [STATUS.PACKED]: 'Packed and ready',
  [STATUS.PICKED]: 'Picked up by your delivery partner',
  [STATUS.OUT]: 'On the way to you',
  [STATUS.ARRIVING]: 'On the way to you',
  [STATUS.REACHED]: 'Delivery partner has arrived',
  [STATUS.DELIVERED]: 'Delivered',
  [STATUS.FAILED]: 'Delivery attempt failed',
  [STATUS.CANCELLED]: 'Order cancelled',
};

export const shortId = (id = '') => id.slice(-6).toUpperCase();

export const mapsLink = (address) => {
  if (!address) return '#';
  const q = [address.street, address.city, address.state, address.zipcode].filter(Boolean).join(', ');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
};

export const timeAgo = (date) => {
  if (!date) return '';
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return new Date(date).toLocaleDateString();
};

// Delivery promise shown in the storefront
export const DELIVERY_ETA = import.meta.env.VITE_DELIVERY_ETA || '10 minutes';
