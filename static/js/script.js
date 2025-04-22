let currentPage = 1;
let currentSearch = '';
const pageSize = 10;

// Update authentication UI based on login status
function updateAuthUI() {
  const authButtons = document.getElementById("auth-buttons");
  const userInfo = document.getElementById("user-info");
  const accessToken = localStorage.getItem("accessToken");
  const fullName = localStorage.getItem("fullName");

  if (authButtons && userInfo) {
    if (accessToken && fullName) {
      // User is logged in
      authButtons.style.display = "none";
      userInfo.style.display = "block";
      userInfo.innerHTML = `Welcome, ${fullName}! <button onclick="handleLogout()">Logout</button>`;
    } else {
      // User is not logged in
      authButtons.style.display = "block";
      userInfo.style.display = "none";
      userInfo.innerHTML = "";
    }
  } else {
    console.error("Auth buttons or user info div not found");
  }
}

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
      page_size: pageSize,
    });
    if (search) {
      params.append('search', search);
    }
    const url = `/proxy/books?${params.toString()}`;
    console.log('Fetching URL:', url);

    // Get access token for authenticated request
    const accessToken = localStorage.getItem("accessToken");
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("fullName");
        updateAuthUI();
        throw new Error("Session expired. Please log in again.");
      }
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log("API Response:", JSON.stringify(data, null, 2));

    const books = data.results || [];
    const totalCount = data.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    booksList.innerHTML = ""; // Clear loading message

    if (!Array.isArray(books) || books.length === 0) {
      booksList.innerHTML = "<p>No books found.</p>";
      console.log("No books found or results is not an array:", books);
      return;
    }

    // Render books
    console.log("Rendering", books.length, "books");
    books.forEach((book, index) => {
      console.log(`Rendering book ${index + 1}:`, book);
      const bookDiv = document.createElement("div");
      bookDiv.className = "book-item";

      // Handle URLs (relative or full)
      const baseUrl = "http://192.168.100.63:8000";
      const pdfUrl = book.pdf
        ? book.pdf.startsWith("http")
          ? book.pdf
          : `${baseUrl}${book.pdf}`
        : null;
      const imageUrl = book.first_page_image
        ? book.first_page_image.startsWith("http")
          ? book.first_page_image
          : `${baseUrl}${book.first_page_image}`
        : null;

      // Image or "Not found"
      const imageHtml = imageUrl
        ? `<img src="${imageUrl}" alt="${
            book.name || "Book cover"
          }" onerror="this.src='https://via.placeholder.com/150?text=Image+Not+Found'">`
        : '<p class="not-found">Not found</p>';

      // PDF or "Not found"
      const pdfHtml = pdfUrl
        ? `<p>PDF: <a class="pdf-link" href="${pdfUrl}" target="_blank">${book.pdf
            .split("/")
            .pop()}</a></p>`
        : '<p class="not-found">Not found</p>';

      bookDiv.innerHTML = `
                ${imageHtml}
                <div class="book-details">
                    <h3>${book.name || "No title"}</h3>
                    <p>Created: ${book.created_at || "N/A"}</p>
                    <p>Updated: ${book.updated_at || "N/A"}</p>
                    ${pdfHtml}
                </div>
            `;
      booksList.appendChild(bookDiv);
    });

    // Render pagination
    console.log("Total pages:", totalPages);
    if (totalPages > 1) {
      const prevButton = document.createElement("button");
      prevButton.textContent = "Previous";
      prevButton.disabled = !data.previous;
      prevButton.onclick = () => fetchBooks(page - 1, search);
      paginationDiv.appendChild(prevButton);

      const startPage = Math.max(1, page - 2);
      const endPage = Math.min(totalPages, startPage + 4);
      for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement("button");
        pageButton.textContent = i;
        pageButton.className = i === page ? "active" : "";
        pageButton.onclick = () => fetchBooks(i, search);
        paginationDiv.appendChild(pageButton);
      }

      const nextButton = document.createElement("button");
      nextButton.textContent = "Next";
      nextButton.disabled = !data.next;
      nextButton.onclick = () => fetchBooks(page + 1, search);
      paginationDiv.appendChild(nextButton);
    }
  } catch (error) {
    booksList.innerHTML = ""; // Clear loading message
    errorDiv.innerHTML = `Error fetching books: ${error.message}`;
    console.error("Fetch error:", error);
    if (error.message.includes("Session expired")) {
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    }
  }
}

// Search function
function searchBooks() {
  const searchInput = document.getElementById("search-input").value.trim();
  currentSearch = searchInput;
  currentPage = 1;
  console.log("Searching for:", currentSearch);
  fetchBooks(currentPage, currentSearch);
}

// Logout function
function handleLogout() {
  console.log("Logging out");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("fullName");
  updateAuthUI();
  fetchBooks(currentPage, currentSearch); // Refresh book list
}

// Initial fetch and UI update
console.log("Starting initial fetch");
updateAuthUI();
fetchBooks(currentPage, currentSearch);