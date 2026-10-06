// Red de colaboradores de FAIRINO Spain, tal como aparecen (número, nombre y ciudad) en el vídeo de FDI
// «Únete a nuestra red de colaboradores» (octubre de 2026). Los logos son recortes de sus fichas en ese vídeo
// (src/assets/images/partners/<slug>.png); cambiarlos por los originales de cada colaborador cuando los tengamos.
// lat/lon: centro del municipio (OpenStreetMap), solo para situar el punto en el mapa de la red, no la dirección.
export interface Partner {
  n: string;
  slug: string;
  name: string;
  place: string;
  lat: number;
  lon: number;
}

// Sede de FAIRINO Spain en el mapa (Avenida de la Estación, Villaluenga de la Sagra, según OpenStreetMap), de donde
// salen las líneas hacia cada colaborador.
export const hq = { name: 'FAIRINO Spain', place: 'Villaluenga de la Sagra · Toledo', lat: 40.0374, lon: -3.9133 };

export const partners: Partner[] = [
  { n: '01', slug: 'emsira', name: 'Emsira', place: 'Guadarrama · Madrid', lat: 40.6724, lon: -4.089 },
  { n: '02', slug: 'out-industrial', name: 'Out Industrial', place: 'Berrioplano · Navarra', lat: 42.8621, lon: -1.706 },
  { n: '03', slug: 'nuar', name: 'Nuar', place: 'Orkoien · Navarra', lat: 42.8235, lon: -1.7023 },
  { n: '04', slug: 'hebradera', name: 'Hebradera', place: 'Villena · Alicante', lat: 38.6361, lon: -0.866 },
  { n: '05', slug: 'igus', name: 'igus', place: 'Vilanova i la Geltrú · Barcelona', lat: 41.2242, lon: 1.7256 },
  { n: '06', slug: 'intevo', name: 'Intevo', place: 'Manresa · Barcelona', lat: 41.7289, lon: 1.8287 },
  { n: '07', slug: 'fluenzia', name: 'Fluenzia', place: 'Carballo · A Coruña', lat: 43.2086, lon: -8.6668 },
  { n: '08', slug: 'enira', name: 'Enira', place: 'Paterna · Valencia', lat: 39.5259, lon: -0.4733 },
  { n: '09', slug: 'sokad', name: 'Sokad', place: 'Celrà · Girona', lat: 42.0247, lon: 2.879 },
  { n: '10', slug: 'rovimatica', name: 'Rovimática', place: 'Córdoba', lat: 37.8846, lon: -4.776 },
  { n: '11', slug: 'camprodon', name: 'Camprodón', place: 'Zaragoza', lat: 41.6916, lon: -0.9101 },
  { n: '12', slug: 'iberpak', name: 'Iberpak', place: 'Molina de Segura · Murcia', lat: 38.0572, lon: -1.2095 },
  { n: '13', slug: 'beanuvi', name: 'Comercial Beanuvi', place: 'Sevilla', lat: 37.3886, lon: -5.9953 },
];
