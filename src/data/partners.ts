// Red de colaboradores de FAIRINO Spain, tal como aparecen (número, nombre y ciudad) en el vídeo de FDI
// «Únete a nuestra red de colaboradores» (octubre de 2026). Los logos son recortes de sus fichas en ese vídeo
// (src/assets/images/partners/<slug>.png); cambiarlos por los originales de cada colaborador cuando los tengamos.
export interface Partner {
  n: string;
  slug: string;
  name: string;
  place: string;
}

export const partners: Partner[] = [
  { n: '01', slug: 'emsira', name: 'Emsira', place: 'Guadarrama · Madrid' },
  { n: '02', slug: 'out-industrial', name: 'Out Industrial', place: 'Berrioplano · Navarra' },
  { n: '03', slug: 'nuar', name: 'Nuar', place: 'Orkoien · Navarra' },
  { n: '04', slug: 'hebradera', name: 'Hebradera', place: 'Villena · Alicante' },
  { n: '05', slug: 'igus', name: 'igus', place: 'Vilanova i la Geltrú · Barcelona' },
  { n: '06', slug: 'intevo', name: 'Intevo', place: 'Manresa · Barcelona' },
  { n: '07', slug: 'fluenzia', name: 'Fluenzia', place: 'Carballo · A Coruña' },
  { n: '08', slug: 'enira', name: 'Enira', place: 'Paterna · Valencia' },
  { n: '09', slug: 'sokad', name: 'Sokad', place: 'Celrà · Girona' },
  { n: '10', slug: 'rovimatica', name: 'Rovimática', place: 'Córdoba' },
  { n: '11', slug: 'camprodon', name: 'Camprodón', place: 'Zaragoza' },
  { n: '12', slug: 'iberpak', name: 'Iberpak', place: 'Molina de Segura · Murcia' },
  { n: '13', slug: 'beanuvi', name: 'Comercial Beanuvi', place: 'Sevilla' },
];
