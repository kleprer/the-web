import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOMetaProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  type?: 'website' | 'article' | 'profile';  // исправлено: ogType -> type
  noIndex?: boolean;
  publishedTime?: string;
  author?: string;
}

/**
 * компонент для динамических мета-тегов (seo + open graph)
 * используется на всех страницах для правильной индексации
 */
const SEOMeta: React.FC<SEOMetaProps> = ({
  title,
  description,
  keywords = 'журналистские расследования, сбор доказательств, таймлайн, ассистент журналиста',
  canonicalUrl,
  ogImage = '/logo.svg',
  type = 'website',
  noIndex = false,
  publishedTime,
  author = 'журналистский ассистент'
}) => {
  const siteTitle = 'журналистский ассистент | платформа для расследований';
  const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;
  const siteUrl = 'http://localhost:3000';
  const finalCanonical = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;

  return (
    <Helmet>
      {/* базовые мета-теги */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      
      {/* robots - запрещаем индексацию служебных страниц */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      
      {/* canonical url - предотвращает дубли */}
      <link rel="canonical" href={finalCanonical} />
      
      {/* open graph / social meta */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={finalCanonical} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:site_name" content="журналистский ассистент" />
      <meta property="og:locale" content="ru_RU" />
      
      {/* twitter card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
      
      {/* дополнительные мета-теги для статей */}
      {type === 'article' && publishedTime && (
        <>
          <meta property="article:published_time" content={publishedTime} />
          <meta property="article:author" content={author} />
        </>
      )}
    </Helmet>
  );
};

export default SEOMeta;