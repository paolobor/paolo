// Centro de descargas: enlaces oficiales de FAIRINO (documentación en inglés y carpetas de descarga),
// los mismos que publica fairino.es/descargas.
export interface DownloadGroup {
  id: string;
  title: string;
  text: string;
  icon: string;
  items: { label: string; href: string; note?: string }[];
}

const RTD = 'https://fairino-doc-en.readthedocs.io/latest';
const drive = (id: string) => `https://drive.google.com/file/d/${id}/view`;
const folder = (id: string) => `https://drive.google.com/drive/folders/${id}`;

export const downloadGroups: DownloadGroup[] = [
  {
    id: 'planos',
    title: 'Planos acotados de los cobots',
    text: 'Dimensiones y cotas de cada modelo para preparar la célula.',
    icon: 'ruler',
    items: [
      { label: 'FR3', href: `${RTD}/_downloads/676bc180d9c94bdd97a18355a4b83ee8/FR3%20Drawings.zip`, note: 'ZIP' },
      { label: 'FR5', href: `${RTD}/_downloads/d0aec4a78c7e5520e502d33d18425649/FR5%20Drawings.zip`, note: 'ZIP' },
      { label: 'FR10', href: `${RTD}/_downloads/834fdc8d52dec00b13468df60e177010/FR10%20Drawings.zip`, note: 'ZIP' },
      { label: 'FR16', href: `${RTD}/_downloads/34ce263a3e2e66f9dbea28185c695f5b/FR16%20Drawings.zip`, note: 'ZIP' },
      { label: 'FR20', href: `${RTD}/_downloads/3c8541fece44b186c4aec11c6547e908/FR20%20Drawings.zip`, note: 'ZIP' },
      { label: 'FR30', href: `${RTD}/_downloads/acac4f18e462155ccb5485aa2cbb5f75/FR30%20Drawings.zip`, note: 'ZIP' },
    ],
  },
  {
    id: 'cad',
    title: 'Modelos CAD 3D',
    text: 'Modelos STEP de los cobots, los controladores y la caja de seguridad.',
    icon: 'box',
    items: [
      { label: 'Cobots de la serie FR (STEP)', href: `${RTD}/_downloads/49cdf31534d0899683fd176e86a223d1/FRCobots-V6.0%20STEP%20Models.zip`, note: 'ZIP' },
      { label: 'Controlador de FR3, FR5, FR10 y FR16', href: drive('1ppGy8XjnMLqpoYdbBbessvHE5-JoRo7S') },
      { label: 'Controlador de FR20 y FR30', href: drive('1zcxV7f2HaKAkgVDfK5TeSfMNBdbOfGMz') },
      { label: 'Caja de seguridad', href: drive('1KT3mn9AZTwHsZv8udhDRmrUmTsnMh2_I') },
    ],
  },
  {
    id: 'accesorios',
    title: 'Modelos 3D de accesorios',
    text: 'Garras, sensores, soportes y adaptadores oficiales.',
    icon: 'package',
    items: [
      { label: 'Consola de programación (teach pendant)', href: drive('16VQMJJjiNDuFzPZ-WYNR0PYfR5PK1H88') },
      { label: 'Botones de control rápido', href: drive('1tEZTVX52m31NecFEF_L_YEA-esK5PaqZ') },
      { label: 'Sensor de fuerza y par', href: drive('1fewY9v6RN8c1k8PYCi5IsDhvj848nUPG') },
      { label: 'Garra IR40-50', href: drive('1ytbIz5lZp3ns3GpibJ9rGVi7UesL13FA') },
      { label: 'Garra IR75-300', href: drive('1QXpIVGG0A7-EtzvUZ2sh10jupeeump_m') },
      { label: 'Garra IR20-80C', href: drive('1mP4jf4xXucjDjPpU-6k4oy9dyTpBJ30E') },
      { label: 'Garra de vacío eléctrica', href: drive('1TdkMi5zoGg2qZw2oeqXw7cI2z4nv0qDM') },
      { label: 'Garra de vacío 230 × 120', href: drive('1YflvzuvT74hKILNRzs6g09UZ2y1sbt7H') },
      { label: 'Garra de vacío 400 × 280', href: drive('197yKRfA1GM5nBEpSUMspdYTZaUlRrEIC') },
      { label: 'Cambiador rápido de herramienta', href: drive('1YT3MMNyaqBZjIu2je_i7QguEYdxzAZEl') },
      { label: 'Adaptador para doble herramienta', href: drive('1dF_xw-P9szgAjIL-xykjZmBNXAqfT6MD') },
      { label: 'Adaptador de antorcha de soldadura', href: drive('1JfsfDBko1eBGlK6aGRAUZNMe0Y_5Ibvh') },
      { label: 'Base magnética', href: drive('11H4Yy6wwjU8qumBSO54RkBrGkKsn1kXd') },
      { label: 'Mesa de desarrollo', href: drive('17w_pbDCM3NW2H9LanVmA3IFedRL2_11F') },
      { label: 'Soporte para cobot', href: drive('1tQ20fja1sKcT7yrx_xZ-stC7gVKFE5PX') },
    ],
  },
  {
    id: 'manuales',
    title: 'Manuales',
    text: 'Manual del cobot, del SDK y vídeos de formación.',
    icon: 'file-text',
    items: [
      { label: 'Manual del cobot', href: `${RTD}/` },
      { label: 'Manual del SDK', href: `${RTD}/SDKManual/index.html` },
      { label: 'Vídeos de la Academia FAIRINO', href: 'https://www.youtube.com/watch?v=LByaAnuQdRU', note: 'YouTube' },
    ],
  },
  {
    id: 'programacion',
    title: 'Programación y software',
    text: 'SDK para integrar los cobots desde tu propio software.',
    icon: 'cpu',
    items: [
      { label: 'SDK de C++', href: 'https://github.com/FAIR-INNOVATION/fairino-cpp-sdk/releases' },
      { label: 'SDK de C#', href: 'https://github.com/FAIR-INNOVATION/fairino-csharp-sdk/releases' },
      { label: 'SDK de Python', href: 'https://github.com/FAIR-INNOVATION/fairino-python-sdk/releases' },
      { label: 'SDK de Java', href: 'https://github.com/FAIR-INNOVATION/fairino-java-sdk/releases' },
      { label: 'ROS', href: `${RTD}/ROSGuide/index.html` },
      { label: 'ROS 2', href: `${RTD}/ROSGuide/index.html#frcobot-ros2` },
      { label: 'Software del cobot', href: `${RTD}/download.html#robot-software` },
    ],
  },
  {
    id: 'protocolos',
    title: 'Protocolos de comunicación',
    text: 'Archivos para integrar el cobot en tu sistema.',
    icon: 'git-branch',
    items: [
      { label: 'URDF / ROS 2', href: drive('1OJA1ZUZxf12ssfeSigTyjMe97gxBo7du') },
      { label: 'PROFINET', href: folder('1-fpa6LmlkVaOFBsNVaJ21oIL8tZkGZLi'), note: 'Carpeta' },
      { label: 'NVIDIA Isaac', href: folder('1h25XQMnn36gsr_6T0ZP3YSkT2ZYOOoif'), note: 'Carpeta' },
      { label: 'Tabla Modbus TCP/IP', href: `${RTD}/CobotsManual/coding.html#modbustcp-slave-robot-state-feedback-and-control` },
      { label: 'Tabla Modbus RTU', href: `${RTD}/CobotsManual/coding.html#robot-status-feedback-and-control-via-modbusrtu-slave` },
    ],
  },
  {
    id: 'general',
    title: 'Documentación técnica',
    text: 'Parámetros, curvas de carga, conexionado y códigos de error.',
    icon: 'layers',
    items: [
      { label: 'Parámetros básicos', href: 'https://manual.fairino.support/latest/CobotsManual/robot_brief_introduction.html#robot-brief-introduction' },
      { label: 'Curvas de carga', href: 'https://manual.fairino.support/latest/CobotsManual/installation.html#fr3-model-collaborative-robot-load-curve' },
      { label: 'Pines del controlador', href: `${RTD}/CobotsManual/installation.html#controller-i-o-panel` },
      { label: 'Pines del extremo del brazo', href: `${RTD}/CobotsManual/installation.html#end-plate` },
      { label: 'Códigos de error', href: 'https://manual.fairino.support/latest/CobotsManual/appendix.html#appendix' },
      { label: 'Corriente máxima de salida', href: `${RTD}/CobotsManual/installation.html#the-common-specifications-of-all-digital-i-o` },
      { label: 'Entradas y salidas NPN', href: `${RTD}/CobotsManual/installation.html#summary-of-digital-input-of-control-box` },
      { label: 'Entradas digitales', href: `${RTD}/CobotsManual/installation.html#digital-input-from-the-button` },
      { label: 'Salidas digitales', href: `${RTD}/CobotsManual/installation.html#universal-digital-amount-i-o` },
      { label: 'Actualizar el software', href: `${RTD}/CobotsManual/system.html#software-upgrade` },
    ],
  },
  {
    id: 'webapp',
    title: 'Aplicación web',
    text: 'Versiones del software de la interfaz web del cobot.',
    icon: 'refresh-cw',
    items: [
      { label: 'Registro de cambios', href: `${RTD}/CobotsManual/version_intro.html` },
      { label: 'Límites al actualizar', href: `${RTD}/CobotsManual/system.html#important-notes` },
      { label: 'Versión 3.9.8', href: drive('1a5TpeckanH_z4U472Bjhx63eScgn1XaX'), note: 'Última' },
      { label: 'Versión 3.9.7', href: drive('1vQmhZ__hHGldmrP9AoIpnsG5tYJhZ-1e') },
      { label: 'Versión 3.9.6', href: drive('1o8ThIM2C_i5dUq2kXyXdLeNOzKxO05dV') },
      { label: 'Versión 3.9.5', href: drive('1CSf-kVv_g9Pwyu5hJ-cPUiAm4G7iw6Pu') },
      { label: 'Versión 3.9.4', href: drive('1z7c9pdUneWDUoQ-kCxtsW0XFwnALcuux') },
      { label: 'Versión 3.9.3', href: drive('1zUhhuhdC0gLZZeZ5VCjSkkQMA-5CTQwn') },
      { label: 'Versión 3.9.2', href: drive('1nTF2gvKyNcjtzcAwpQ7eWrklcQ64P1PQ') },
      { label: 'Versión 3.9.1', href: drive('10Xj2WkrMD3j-cpaQQusLpXBkaDDSqQNh') },
      { label: 'Versión 3.9.0', href: drive('1hBgywiRvoQ8MrCl-TmflBzpQ599gR8Ri') },
      { label: 'Versión 3.8.7', href: drive('1AZEZJRpWt0YP3EYWXZOquK6DbUgvW9Ex') },
      { label: 'Versión 3.8.6', href: drive('1K5X_nqm1qem90zGTWB07a--M3VwhdtAH') },
      { label: 'Versión 3.8.5', href: drive('1z42uFeuI7i_fWRkFaq4p9O2QIjoNtsCG') },
      { label: 'Versión 3.8.4', href: drive('1CvrC2RtjyEHVyTonBYwXMcEhyl_Uhgeu') },
      { label: 'Versión 3.8.3', href: drive('1cGwBqjt7bjkzpeHIbKZdAXjn_u6HaV0X') },
      { label: 'Versión 3.8.2', href: drive('1tUCvaiAqvsfaCuT2j2uYpV2_WFVxnrfM') },
      { label: 'Versión 3.8.1', href: drive('1TGPzUfpeayVlTeO2jvnPl2I4yw3c-1jY') },
      { label: 'Versión 3.8.0', href: drive('1VoFhoQ8nrwr2jkjFb99PJqbIliw4phCi') },
    ],
  },
  {
    id: 'maquina-virtual',
    title: 'Máquina virtual',
    text: 'Para programar y probar sin el cobot delante.',
    icon: 'scan-eye',
    items: [
      { label: 'Software anfitrión', href: drive('1VadBa8GM-KlSnfry_rj5JddaHe5xc91v') },
      { label: 'Imagen de la máquina virtual', href: drive('1vIjcIybeub53uYaXHeV3iHZcDsrmHzsI') },
      { label: 'Manual de instalación', href: `${RTD}/VMMachine/controller_virtual_machine.html` },
    ],
  },
  {
    id: 'certificados',
    title: 'Certificaciones',
    text: 'Marcado CE, ISO 9001 y otras acreditaciones.',
    icon: 'award',
    items: [
      { label: 'Certificado CE', href: `${RTD}/download.html#qualification-certification` },
      { label: 'Certificado ISO 9001', href: `${RTD}/download.html#qualification-certification` },
      { label: 'Otros certificados', href: `${RTD}/download.html#qualification-certification` },
    ],
  },
];
