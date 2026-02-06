import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const UserLocationMap = ({ users = [] }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {

    if (!mapInstanceRef.current && mapRef.current) {
      const map = L.map(mapRef.current, {
        center: [-14.235, -51.925],
        zoom: 4,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const validUsers = users.filter(u => u.latitude && u.longitude);

    console.log('[UserLocationMap] Total users:', users.length);
    console.log('[UserLocationMap] Valid users:', validUsers.length);
    console.log('[UserLocationMap] Users data:', validUsers.map(u => ({ 
      name: u.name, 
      isOnline: u.isOnline, 
      userId: u.userId 
    })));

    if (validUsers.length === 0) return;

    const locationGroups = new Map();
    validUsers.forEach(user => {
      const key = `${user.latitude},${user.longitude}`;
      if (!locationGroups.has(key)) {
        locationGroups.set(key, []);
      }
      locationGroups.get(key).push(user);
    });

    validUsers.forEach(user => {

      const iconColor = user.isOnline ? '#22c55e' : '#94a3b8';
      console.log(`[UserLocationMap] User ${user.name}: isOnline=${user.isOnline}, color=${iconColor}`);

      const locationKey = `${user.latitude},${user.longitude}`;
      const usersAtLocation = locationGroups.get(locationKey);
      let lat = parseFloat(user.latitude);
      let lng = parseFloat(user.longitude);
      
      if (usersAtLocation.length > 1) {
        const index = usersAtLocation.indexOf(user);

        const angle = (index / usersAtLocation.length) * Math.PI * 2;
        const offset = 0.01;
        lat += Math.cos(angle) * offset;
        lng += Math.sin(angle) * offset;
        console.log(`[UserLocationMap] Applying offset to ${user.name}: ${index}/${usersAtLocation.length} users at this location`);
      }
      
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${iconColor};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
          ">
            ${user.isOnline ? '●' : '○'}
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(mapInstanceRef.current);

      const popupContent = `
        <div style="font-family: system-ui; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1e293b;">
            ${user.name || user.email}
          </h3>
          <div style="font-size: 12px; color: #64748b; line-height: 1.6;">
            <div style="margin: 4px 0;">
              <strong>Status:</strong> 
              <span style="color: ${user.isOnline ? '#22c55e' : '#94a3b8'};">
                ${user.isOnline ? '🟢 Online' : '⚪ Offline'}
              </span>
            </div>
            <div style="margin: 4px 0;">
              <strong>Localização:</strong> ${user.city || 'Desconhecida'}${user.region ? ', ' + user.region : ''}
            </div>
            ${user.country ? `<div style="margin: 4px 0;"><strong>País:</strong> ${user.country}</div>` : ''}
            ${user.currentPage ? `<div style="margin: 4px 0;"><strong>Página:</strong> ${user.currentPage}</div>` : ''}
            ${user.connectedAt ? `
              <div style="margin: 4px 0;">
                <strong>Conectado em:</strong> ${new Date(user.connectedAt).toLocaleString('pt-BR')}
              </div>
            ` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
      });

      markersRef.current.push(marker);
    });

    if (validUsers.length > 0) {
      const bounds = L.latLngBounds(validUsers.map(u => [u.latitude, u.longitude]));
      mapInstanceRef.current.fitBounds(bounds, { 
        padding: [50, 50],
        maxZoom: 12 
      });
    }
  }, [users]);

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="w-full h-[500px] rounded-lg border border-neutral-200 shadow-sm"
        style={{ zIndex: 1 }}
      />

      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-neutral-200 z-[1000]">
        <div className="text-xs font-semibold text-neutral-700 mb-2">Legenda</div>
        <div className="flex items-center gap-2 text-xs text-neutral-600 mb-1">
          <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
          <span>Online</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <div className="w-4 h-4 rounded-full bg-neutral-400 border-2 border-white"></div>
          <span>Offline</span>
        </div>
      </div>
    </div>
  );
};

export default UserLocationMap;
