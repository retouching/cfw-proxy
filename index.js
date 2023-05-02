import { Router } from 'itty-router';

const router = Router();
let ENV = {};

function asJSON(obj, status = 200) {
	return new Response(JSON.stringify(obj, null, 2), {
		status,
		headers: {
			'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Max-Age': '86400',
			'Content-Type': 'application/json;charset=UTF-8'
		}
	});
}

router.get('/', async ({ query, url }) => {
	if (!query.url) return asJSON({ 'error': 'URL missing' }, 400);

	let queryURL;

	try {
		queryURL = new URL(query.url);
	} catch (_) {
		return asJSON({ 'error': 'Invalid URL' }, 400);
	}

	if (queryURL.host === new URL(url).host) return asJSON({ 'error': 'Invalid URL' }, 400);

	let req = await fetch(query.url).catch(() => null);

	if (!req || req.status > 299) return asJSON({ 'error': 'URL return invalid status code' }, 400);

	const contentType = query.content_type || req.headers.get('Content-Type');
	const { readable, writable } = new TransformStream();

	req.body.pipeTo(writable);
	return new Response(readable, {
		headers: {
			'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Max-Age': '86400',
			'Content-Type': contentType || 'application/octet-stream',
		}
	});
});

router.all('*', () => asJSON({
	error: 'Not found'
}, 404));

export default {
	fetch: router.handle
};
