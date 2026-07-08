"""
Maps CSV → 筛选无网站商家 → 自动建站 → 发通知

用法:
  python maps_to_website.py --input OR_Raw.csv --api-url https://your-worker.com

前提:
  pip install requests
  BREVO_API_KEY 环境变量
"""

import csv
import os
import sys
import json
import requests
import argparse
import re
from urllib.parse import urlparse

# ── Config ──
MIN_RATING = 4.0
MIN_REVIEWS = 50
API_URL = os.environ.get('API_URL', '')
API_SECRET = os.environ.get('API_SECRET', '')
BREVO_API_KEY = os.environ.get('BREVO_API_KEY', '')
FROM_EMAIL = 'hello@ink-flows.com'
FROM_NAME = 'InkFlow'


def has_website(website: str) -> bool:
    """Check if a business has a real website"""
    if not website or website.strip() in ('', '-', 'N/A', 'n/a', 'None'):
        return False
    w = website.strip().lower()
    # Filter out placeholder URLs
    if w in ('http://', 'https://', 'http://none', 'https://none'):
        return False
    # Check if it's a real domain (not facebook/instagram/yelp page)
    domain = urlparse(w).netloc or urlparse('//' + w).netloc
    if not domain:
        return False
    # Skip social media profiles (they're not websites)
    social_domains = ('facebook.com', 'instagram.com', 'yelp.com', 'tiktok.com',
                      'twitter.com', 'x.com', 'youtube.com', 'pinterest.com')
    if any(s in domain for s in social_domains):
        return False
    return True


def generate_slug(name: str, city: str) -> str:
    """Generate URL slug from business name + city"""
    base = f"{name} {city}"
    slug = base.lower().strip()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug[:60].rstrip('-')


def send_email_brevo(to_email: str, to_name: str, business_name: str, site_url: str):
    """Send notification email via Brevo API"""
    if not BREVO_API_KEY:
        print(f"  ⚠️ BREVO_API_KEY not set, skipping email to {to_email}")
        return False

    subject = f"Free website created for {business_name}"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi {to_name or business_name},</h2>
        <p>We noticed your business doesn't have a website yet, so we created one for you — <strong>completely free</strong>.</p>
        <p style="font-size: 18px; text-align: center; margin: 24px 0;">
            <a href="{site_url}" style="background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                View Your Free Website →
            </a>
        </p>
        <p>Your site: <a href="{site_url}">{site_url}</a></p>
        <p>No strings attached. If you'd like a custom domain (like <strong>booking.yourstudio.com</strong>) and a professional email, you can upgrade anytime.</p>
        <hr style="margin: 24px 0;">
        <p style="color: #64748b; font-size: 12px;">Powered by InkFlow — https://ink-flows.com</p>
    </div>
    """

    resp = requests.post(
        'https://api.brevo.com/v3/smtp/email',
        headers={
            'api-key': BREVO_API_KEY,
            'Content-Type': 'application/json',
        },
        json={
            'sender': {'name': FROM_NAME, 'email': FROM_EMAIL},
            'to': [{'email': to_email, 'name': to_name or business_name}],
            'subject': subject,
            'htmlContent': html,
        }
    )
    return resp.ok


def main():
    parser = argparse.ArgumentParser(description='Maps data → auto website builder')
    parser.add_argument('--input', required=True, help='CSV file from Maps scraper')
    parser.add_argument('--api-url', default=API_URL, help='InkFlow API URL')
    parser.add_argument('--api-secret', default=API_SECRET, help='API secret')
    parser.add_argument('--dry-run', action='store_true', help='Just show what would be created')
    parser.add_argument('--send-email', action='store_true', help='Send notification emails')
    args = parser.parse_args()

    if not args.api_url:
        print("❌ API_URL required. Set env or use --api-url")
        sys.exit(1)

    # ── Read CSV ──
    businesses = []
    with open(args.input, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        for row in reader:
            businesses.append(row)

    print(f"📊 Total businesses in CSV: {len(businesses)}")

    # ── Filter ──
    candidates = []
    for b in businesses:
        try:
            rating = float(b.get('rating', b.get('Rating', 0)) or 0)
            reviews = int(b.get('reviews', b.get('Reviews', b.get('total_reviews', 0))) or 0)
        except (ValueError, TypeError):
            continue

        name = b.get('name', b.get('Name', ''))
        website = b.get('website', b.get('Website', b.get('site', '')))
        city = b.get('city', b.get('City', ''))
        phone = b.get('phone', b.get('Phone', ''))
        email = b.get('email', b.get('Email', ''))
        instagram = b.get('instagram', b.get('Instagram', ''))
        address = b.get('address', b.get('Address', ''))

        if not name:
            continue

        criteria = {
            'has_website': has_website(website),
            'rating_ok': rating >= MIN_RATING,
            'reviews_ok': reviews >= MIN_REVIEWS,
        }

        if not criteria['has_website'] and criteria['rating_ok'] and criteria['reviews_ok']:
            candidates.append({
                'name': name,
                'city': city.strip().title() if city else '',
                'phone': phone,
                'email': email,
                'instagram': instagram,
                'address': address,
                'rating': rating,
                'reviews': reviews,
                'slug': generate_slug(name, city or ''),
                'bio': f"{name} — professional service in {city or address or 'your area'}. Call {phone or 'today'} to book.",
            })

    print(f"🎯 Candidates (no website, {MIN_RATING}+ rating, {MIN_REVIEWS}+ reviews): {len(candidates)}")

    if args.dry_run:
        print("\n─── Dry Run ───")
        for c in candidates[:10]:
            print(f"  ✅ {c['name']} ({c['city']}) → ink-flows.com/tattoo/{c['slug']}")
        if len(candidates) > 10:
            print(f"  ... and {len(candidates) - 10} more")
        print(f"\nTotal: {len(candidates)} sites would be created")
        return

    # ── Call Batch API ──
    print(f"\n🚀 Creating {len(candidates)} sites...")
    resp = requests.post(
        f"{args.api_url.rstrip('/')}/api/site-config/batch",
        headers={
            'Content-Type': 'application/json',
            'x-api-secret': args.api_secret,
        },
        json={'businesses': candidates}
    )

    if not resp.ok:
        print(f"❌ API error: {resp.status_code} {resp.text}")
        sys.exit(1)

    result = resp.json()
    print(f"✅ Created: {result.get('created', 0)} / {result.get('total', 0)}")

    # ── Send Emails ──
    if args.send_email and BREVO_API_KEY:
        print(f"\n📧 Sending emails...")
        for i, c in enumerate(candidates):
            site_url = f"https://ink-flows.com/tattoo/{c['slug']}"
            if c.get('email'):
                ok = send_email_brevo(c['email'], c['name'], c['name'], site_url)
                print(f"  {'✅' if ok else '❌'} {c['name']} → {c['email']}")
            else:
                print(f"  ⏭️ {c['name']} — no email found")
            if (i + 1) % 10 == 0:
                print(f"  ... {i+1}/{len(candidates)} done")
    elif args.send_email:
        print("⚠️ --send-email set but BREVO_API_KEY not configured")

    print(f"\n✨ Done! {result.get('created', 0)} sites created")
    print(f"   Example: https://ink-flows.com/tattoo/{candidates[0]['slug']}" if candidates else "")


if __name__ == '__main__':
    main()
