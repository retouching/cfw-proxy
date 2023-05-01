/************************************************/
/*                CONFIGURATION                 */
/************************************************/

const CORS_ORIGIN = 'https://example.com';
const ACCESS_TOKEN = 'xxx';

/************************************************/

import { Router } from 'itty-router';

const router = Router();

function asJSON(obj, status = 200) {
	return new Response(JSON.stringify(obj, null, 2), {
		status,
		headers: {
			'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Max-Age': '86400',
			'Content-Type': 'application/json;charset=UTF-8'
		}
	});
}

function checkAuth({ query }) {
	return query.authorization == ACCESS_TOKEN;
}

router.get('/', async (http) => {
	if (!checkAuth(http)) return asJSON({ 'error': 'Forbidden' }, 403);

	const { query } = http;

	if (!query.url) return asJSON({ 'error': 'URL missing' }, 400);

	let req = await fetch(query.url).catch(() => null);

	if (!req || req.status > 299) return asJSON({ 'error': 'URL return invalid status code' }, 400);

	const contentType = query.content_type || req.headers.get('Content-Type');
	const { readable, writable } = new TransformStream();

	req.body.pipeTo(writable);
	return new Response(readable, {
		headers: {
			'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Max-Age': '86400',
			'Content-Type': contentType || 'application/octet-stream',
		}
	});
});

router.all('*', () => asJSON({
	error: 'Not found'
}, 404));

export default { fetch: router.handle };
