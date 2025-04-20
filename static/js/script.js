(async function fetchBooks() {
    const booksList = document.getElementById('books-list');
    const errorDiv = document.getElementById('error');
    booksList.innerHTML = '<div class="loading">Loading books...</div>';
    errorDiv.innerHTML = '';

    try {
        const response = await fetch('http://192.168.100.63/library/books/', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const books = data.results || [];
        
        booksList.innerHTML = ''; // Clear loading message

        if (!Array.isArray(books) || books.length === 0) {
            booksList.innerHTML = '<p>No books found.</p>';
            return;
        }

        books.forEach(book => {
            const bookDiv = document.createElement('div');
            bookDiv.className = 'book-item';
            
            // Construct full URLs for pdf and first_page_image
            const baseUrl = 'http://192.168.100.63';
            const pdfUrl = book.pdf ? `${baseUrl}${book.pdf}` : '#';
            const imageUrl = book.first_page_image ? `${baseUrl}${book.first_page_image}` : 'https://via.placeholder.com/150?text=Book+Cover';

            bookDiv.innerHTML = `
                <img src="${imageUrl}" alt="${book.name || 'Book cover'}" onerror="this.src='https://via.placeholder.com/150?text=Image+Not+Found'">
                <div class="book-details">
                    <h3>${book.name || 'No title'}</h3>
                    <p>ID: ${book.id || 'N/A'}</p>
                    <p>Created: ${book.created_at || 'N/A'}</p>
                    <p>Updated: ${book.updated_at || 'N/A'}</p>
                    <p>PDF: <a class="pdf-link" href="${pdfUrl}" target="_blank">${book.pdf ? book.pdf.split('/').pop() : 'No PDF'}</a></p>
                </div>
            `;
            booksList.appendChild(bookDiv);
        });

    } catch (error) {
        booksList.innerHTML = ''; // Clear loading message
        errorDiv.innerHTML = `Error fetching books: ${error.message}`;
        console.error('Error:', error);
    }
})();