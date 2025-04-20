let currentPage = 1;
let currentSearch = '';
const pageSize = 10;

async function fetchBooks(page = 1, search = '') {
    const booksList = document.getElementById('books-list');
    const errorDiv = document.getElementById('error');
    const paginationDiv = document.getElementById('pagination');
    booksList.innerHTML = '<div class="loading">Loading books...</div>';
    errorDiv.innerHTML = '';
    paginationDiv.innerHTML = '';

    try {
        // Construct URL with query parameters
        const params = new URLSearchParams({
            page: page,
            page_size: pageSize
        });
        if (search) {
            params.append('search', search);
        }
        const url = `/proxy/books?${params.toString()}`;
        console.log('Fetching URL:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2));

        const books = data.results || [];
        const totalCount = data.count || 0;
        const totalPages = Math.ceil(totalCount / pageSize);
        
        booksList.innerHTML = ''; // Clear loading message

        if (!Array.isArray(books) || books.length === 0) {
            booksList.innerHTML = '<p>No books found.</p>';
            console.log('No books found or results is not an array:', books);
            return;
        }

        // Render books
        console.log('Rendering', books.length, 'books');
        books.forEach((book, index) => {
            console.log(`Rendering book ${index + 1}:`, book);
            const bookDiv = document.createElement('div');
            bookDiv.className = 'book-item';
            
            // Handle URLs (relative or full)
            const baseUrl = 'http://192.168.100.63';
            const pdfUrl = book.pdf ? (book.pdf.startsWith('http') ? book.pdf : `${baseUrl}${book.pdf}`) : null;
            const imageUrl = book.first_page_image ? (book.first_page_image.startsWith('http') ? book.first_page_image : `${baseUrl}${book.first_page_image}`) : null;

            // Image or "Not found"
            const imageHtml = imageUrl ? `<img src="${imageUrl}" alt="${book.name || 'Book cover'}" onerror="this.src='https://via.placeholder.com/150?text=Image+Not+Found'">` : '<p class="not-found">Not found</p>';

            // PDF or "Not found"
            const pdfHtml = pdfUrl ? `<p>PDF: <a class="pdf-link" href="${pdfUrl}" target="_blank">${book.pdf.split('/').pop()}</a></p>` : '<p class="not-found">Not found</p>';

            bookDiv.innerHTML = `
                ${imageHtml}
                <div class="book-details">
                    <h3>${book.name || 'No title'}</h3>
                    <p>Created: ${book.created_at || 'N/A'}</p>
                    <p>Updated: ${book.updated_at || 'N/A'}</p>
                    ${pdfHtml}
                </div>
            `;
            booksList.appendChild(bookDiv);
        });

        // Render pagination
        console.log('Total pages:', totalPages);
        if (totalPages > 1) {
            const prevButton = document.createElement('button');
            prevButton.textContent = 'Previous';
            prevButton.disabled = !data.previous;
            prevButton.onclick = () => fetchBooks(page - 1, search);
            paginationDiv.appendChild(prevButton);

            const startPage = Math.max(1, page - 2);
            const endPage = Math.min(totalPages, startPage + 4);
            for (let i = startPage; i <= endPage; i++) {
                const pageButton = document.createElement('button');
                pageButton.textContent = i;
                pageButton.className = i === page ? 'active' : '';
                pageButton.onclick = () => fetchBooks(i, search);
                paginationDiv.appendChild(pageButton);
            }

            const nextButton = document.createElement('button');
            nextButton.textContent = 'Next';
            nextButton.disabled = !data.next;
            nextButton.onclick = () => fetchBooks(page + 1, search);
            paginationDiv.appendChild(nextButton);
        }

    } catch (error) {
        booksList.innerHTML = ''; // Clear loading message
        errorDiv.innerHTML = `Error fetching books: ${error.message}`;
        console.error('Fetch error:', error);
    }
}

// Search function
function searchBooks() {
    const searchInput = document.getElementById('search-input').value.trim();
    currentSearch = searchInput;
    currentPage = 1;
    console.log('Searching for:', currentSearch);
    fetchBooks(currentPage, currentSearch);
}

// Auth handlers (placeholders)
function handleLogin() {
    alert('Login clicked - authentication not implemented yet');
    console.log('Login button clicked');
}

function handleSignUp() {
    alert('Sign Up clicked - authentication not implemented yet');
    console.log('Sign Up button clicked');
}

// Initial fetch
console.log('Starting initial fetch');
fetchBooks(currentPage, currentSearch);