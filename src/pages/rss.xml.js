import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_TITLE } from '../consts';
import { getPostSlug } from '../i18n/utils';
import { ui } from '../i18n/ui';

export async function GET(context) {
	const posts = await getCollection('blog', ({ data }) => data.lang === 'zh' && !data.draft);
	return rss({
		title: SITE_TITLE,
		description: ui.zh['blog.subtitle'],
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: `/blog/${getPostSlug(post.id)}/`,
		})),
	});
}
