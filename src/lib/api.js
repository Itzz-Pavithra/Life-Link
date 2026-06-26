const API_BASE = 'https://jsonplaceholder.typicode.com';

async function request(path, options = {}) {
	const response = await fetch(`${API_BASE}${path}`, {
		headers: {
			'Content-Type': 'application/json',
			...options.headers
		},
		...options
	});

	if (!response.ok) {
		throw new Error(`API request failed with status ${response.status}`);
	}

	const text = await response.text();
	return text ? JSON.parse(text) : {};
}

export function getPosts() {
	return request('/posts?_limit=12');
}

export function getPost(id) {
	return request(`/posts/${id}`);
}

export function createPost(post) {
	return request('/posts', {
		method: 'POST',
		body: JSON.stringify(post)
	});
}

export function updatePost(id, post) {
	return request(`/posts/${id}`, {
		method: 'PUT',
		body: JSON.stringify(post)
	});
}

export function deletePost(id) {
	return request(`/posts/${id}`, {
		method: 'DELETE'
	});
}

