from datetime import datetime
from typing import List, Dict, Any, Optional
import json

def generate_sitemap(routes: List[str], base_url: str = "https://yourdomain.com") -> str:
    """
    генерирует sitemap.xml для индексируемых страниц
    """
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    # приоритетные страницы
    priority_pages = {
        "/": 1.0,
        "/boards": 0.9,
        "/auth": 0.5,
    }
    
    for route in routes:
        priority = priority_pages.get(route, 0.7)
        sitemap += f"""  <url>
    <loc>{base_url}{route}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>{priority}</priority>
  </url>\n"""
    
    sitemap += '</urlset>'
    return sitemap

def generate_robots_txt(allow_routes: List[str], disallow_routes: List[str]) -> str:
    """
    генерирует robots.txt с правилами обхода
    """
    robots = "User-agent: *\n"
    
    # запрещаем служебные страницы
    for route in disallow_routes:
        robots += f"Disallow: {route}\n"
    
    # разрешаем индексацию публичных страниц
    for route in allow_routes:
        robots += f"Allow: {route}\n"
    
    robots += "\nSitemap: https://yourdomain.com/sitemap.xml\n"
    robots += "Host: https://yourdomain.com\n"
    
    return robots

def generate_article_json_ld(
    title: str,
    description: str,
    url: str,
    date_published: str,
    author_name: str = "Journalist Assistant",
    image_url: Optional[str] = None
) -> str:
    """
    генерирует JSON-LD разметку для статьи/расследования
    (структурированные данные для поисковых систем)
    """
    json_ld = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "url": url,
        "datePublished": date_published,
        "dateModified": date_published,
        "author": {
            "@type": "Person",
            "name": author_name
        },
        "publisher": {
            "@type": "Organization",
            "name": "Journalist Assistant",
            "logo": {
                "@type": "ImageObject",
                "url": "https://yourdomain.com/logo.png"
            }
        }
    }
    
    if image_url:
        json_ld["image"] = image_url
    
    return json.dumps(json_ld, ensure_ascii=False)

def generate_webpage_json_ld(
    name: str,
    description: str,
    url: str
) -> str:
    """
    генерирует JSON-LD для обычной веб-страницы
    """
    json_ld = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": name,
        "description": description,
        "url": url
    }
    
    return json.dumps(json_ld, ensure_ascii=False)

def generate_breadcrumb_json_ld(items: List[Dict[str, str]]) -> str:
    """
    генерирует JSON-LD для хлебных крошек
    """
    breadcrumb_items = []
    
    for i, item in enumerate(items):
        breadcrumb_items.append({
            "@type": "ListItem",
            "position": i + 1,
            "name": item["name"],
            "item": item["url"]
        })
    
    json_ld = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumb_items
    }
    
    return json.dumps(json_ld, ensure_ascii=False)