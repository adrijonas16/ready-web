import { SITIO_DESCRIPCION, SITIO_NOMBRE, SITIO_URL, urlAbsoluta } from '@/lib/sitio';

/** Datos estructurados del inicio: tienda en línea (OnlineStore) que atiende Arequipa + sitio web con buscador. */
export function jsonLdInicio() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'OnlineStore',
        '@id': `${SITIO_URL}/#tienda`,
        name: SITIO_NOMBRE,
        description: SITIO_DESCRIPCION,
        url: urlAbsoluta('/'),
        logo: urlAbsoluta('/icon.svg'),
        image: urlAbsoluta('/opengraph-image'),
        currenciesAccepted: 'PEN',
        paymentAccepted: 'Tarjeta, Yape, Plin, PayPal',
        priceRange: 'S/ 1 - S/ 300',
        areaServed: { '@type': 'City', name: 'Arequipa', containedInPlace: { '@type': 'Country', name: 'Perú' } },
        address: { '@type': 'PostalAddress', addressLocality: 'Arequipa', addressRegion: 'Arequipa', addressCountry: 'PE' },
        contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', url: urlAbsoluta('/libro-de-reclamaciones'), availableLanguage: 'es', areaServed: 'PE' },
        hasMerchantReturnPolicy: { '@type': 'MerchantReturnPolicy', applicableCountry: 'PE', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: 7, merchantReturnLink: urlAbsoluta('/terminos#cambios') },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITIO_URL}/#web`,
        url: urlAbsoluta('/'),
        name: SITIO_NOMBRE,
        inLanguage: 'es-PE',
        publisher: { '@id': `${SITIO_URL}/#tienda` },
        potentialAction: { '@type': 'SearchAction', target: `${urlAbsoluta('/catalog')}?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
      },
    ],
  };
}

/** BreadcrumbList a partir de [nombre, ruta]. */
export function jsonLdMigas(migas: [string, string][]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: migas.map(([name, ruta], i) => ({ '@type': 'ListItem', position: i + 1, name, item: urlAbsoluta(ruta) })),
  };
}
