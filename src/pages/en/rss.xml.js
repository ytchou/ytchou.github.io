import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../../consts';
import { includePost } from '../../services/drafts';

export async function GET(context) {
	const posts = await getCollection('blog', post => post.data.lang === 'en' && includePost(post));
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: new URL('/en/', context.site),
		items: posts.map((post) => ({
			...post.data,
			link: `/en/blog/${post.id}/`,
		})),
	});
}
