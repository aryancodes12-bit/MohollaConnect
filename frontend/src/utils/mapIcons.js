import L from 'leaflet';

/**
 * Creates an artisan terracotta / clay marker icon using Leaflet divIcon.
 * Uses SVG with clay palette (#D96B43) and ivory pin center.
 */
export const createClayMarkerIcon = (isSelected = false) => {
  const size = isSelected ? 38 : 32;
  const svgHtml = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size + 8}px;
      display: flex;
      flex-direction: column;
      align-items: center;
      filter: drop-shadow(0 4px 8px rgba(217, 107, 67, 0.45));
      cursor: pointer;
      transition: transform 0.2s ease;
    ">
      <svg viewBox="0 0 32 40" width="${size}" height="${size + 8}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.16344 0 0 7.16344 0 16C0 26.5 16 40 16 40C16 40 32 26.5 32 16C32 7.16344 24.8366 0 16 0Z" fill="${isSelected ? '#E05A47' : '#D96B43'}"/>
        <circle cx="16" cy="15" r="7" fill="#FAF6F0"/>
        <circle cx="16" cy="15" r="3.5" fill="${isSelected ? '#1B1F3B' : '#D96B43'}"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'custom-clay-pin',
    html: svgHtml,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 4)],
  });
};

/**
 * User / Buyer location pin (Neem green / Indigo)
 */
export const createUserLocationIcon = () => {
  const size = 30;
  const svgHtml = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: rgba(43, 88, 12, 0.25);
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <div style="
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: #2B580C;
        border: 3px solid #FAF6F0;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-user-pin',
    html: svgHtml,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};
