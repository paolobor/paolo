import { applications } from './applications';

// Menú principal. Los grupos de Productos se rellenan con el catálogo en el Header.
export const nav = {
  products: {
    label: 'Productos',
    groups: [
      { key: 'cobot', label: 'Cobots', href: 'cobots/' },
      { key: 'controlador', label: 'Controladores', href: 'controladores/' },
      { key: 'accesorio', label: 'Accesorios', href: 'accesorios/' },
    ],
  },
  solutions: {
    label: 'Soluciones',
    applications: applications.map((a) => ({ label: a.name, href: `aplicaciones/${a.slug}/` })),
    more: [
      { label: 'Todas las aplicaciones', href: 'aplicaciones/' },
      { label: 'Industrias', href: 'industrias/' },
      { label: 'Soluciones llave en mano', href: 'soluciones-llave-en-mano/' },
    ],
  },
  links: [
    { label: 'Descargas', href: 'descargas/' },
    { label: 'Nosotros', href: 'sobre-nosotros/' },
    { label: 'Contacto', href: 'contacto/' },
  ],
  warranty: { label: 'Validar garantía', href: 'garantia/' },
  booking: { label: 'Reservar cita', href: 'reservar-cita/' },
};

export const footerNav = {
  productos: [
    { label: 'Cobots', href: 'cobots/' },
    { label: 'Controladores', href: 'controladores/' },
    { label: 'Accesorios', href: 'accesorios/' },
    { label: 'Configurador de célula', href: 'configurador/' },
    { label: 'Descargas', href: 'descargas/' },
  ],
  soluciones: [
    { label: 'Aplicaciones', href: 'aplicaciones/' },
    { label: 'Industrias', href: 'industrias/' },
    { label: 'Llave en mano', href: 'soluciones-llave-en-mano/' },
  ],
  empresa: [
    { label: 'Sobre nosotros', href: 'sobre-nosotros/' },
    { label: 'Blog', href: 'blog/' },
    { label: 'Reservar cita', href: 'reservar-cita/' },
    { label: 'Validar garantía', href: 'garantia/' },
    { label: 'Contacto', href: 'contacto/' },
  ],
  legal: [
    { label: 'Aviso legal', href: 'aviso-legal/' },
    { label: 'Política de privacidad', href: 'politica-de-privacidad/' },
    { label: 'Política de cookies', href: 'politica-de-cookies/' },
  ],
};
