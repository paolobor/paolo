import { site } from '../data/site';

// JSON-LD de empresa. Se incluye en la home y en contacto.
export function organizationSchema(siteUrl: URL) {
  const id = new URL('#organization', siteUrl).toString();
  const address = {
    '@type': 'PostalAddress',
    ...(site.address.street ? { streetAddress: site.address.street } : {}),
    postalCode: site.address.postalCode,
    addressLocality: site.address.city,
    addressRegion: site.address.region,
    addressCountry: site.address.countryCode,
  };
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': id,
      name: site.name,
      legalName: site.legalName,
      url: siteUrl.toString(),
      email: site.contacts[0].email,
      telephone: site.contacts[0].tel,
      address,
      sameAs: site.social.map((s) => s.href),
      contactPoint: site.contacts.map((c) => ({
        '@type': 'ContactPoint',
        telephone: c.tel,
        email: c.email,
        contactType: 'sales',
        areaServed: 'ES',
        availableLanguage: ['es'],
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': new URL('#localbusiness', siteUrl).toString(),
      name: site.name,
      description: site.description,
      url: siteUrl.toString(),
      email: site.contacts[0].email,
      telephone: site.contacts[0].tel,
      address,
      parentOrganization: { '@id': id },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.name,
      url: siteUrl.toString(),
      inLanguage: 'es-ES',
    },
  ];
}
