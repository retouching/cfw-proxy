import { Router } from 'itty-router';
import mime from 'mime';

const router = Router();
const enabledDisplay = ['png', 'jpg', 'ogg', 'flac', 'wav', 'mp3', 'jpeg', 'gif'];

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
	if (!['http', 'https'].includes(queryURL.protocol.toLowerCase())) return asJSON({ 'error': 'Invalid URL' }, 400);

	let req = await fetch(query.url).catch(() => null);

	if (!req || req.status > 299) return asJSON({ 'error': 'URL return invalid status code' }, 400);

	const { readable, writable } = new TransformStream();

	let file = queryURL.pathname.split('?')[0].split('/').pop();
	let headers = 'application/octet-stream';

	if (file.length < 1) file = 'file';
	if (file.startsWith('.')) file = `file${file}`;
	if (!file.includes('.')) file += '.';
	if (file.split('').pop() === '.') {
		const contentType = req.headers.get('Content-Type') || 'application/octet-stream';
		file += mime.getExtension(contentType) || 'unknown';
	}

	if (enabledDisplay.includes(file.split('.').pop().toLowerCase())) {
		headers = mime.getType(file.split('.').pop().toLowerCase());
	}

	req.body.pipeTo(writable);
	return new Response(readable, {
		headers: {
			'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Max-Age': '86400',
			'Content-Type': headers,
			...(headers === 'application/octet-stream' ? {
				'Content-Disposition': `attachment; filename=${file}`
			} : {})
		}
	});
});

router.all('*', () => asJSON({
	error: 'Not found'
}, 404));

export default {
	fetch: router.handle
};
