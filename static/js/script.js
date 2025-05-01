document.addEventListener("DOMContentLoaded", () => {
  console.log("script.js loaded");

  // Update authentication UI based on login status
  function updateAuthUI() {
    const authButtons = document.getElementById("auth-buttons");
    const userInfo = document.getElementById("user-info");
    const accessToken = localStorage.getItem("accessToken");
    const fullName = localStorage.getItem("fullName");

    if (authButtons && userInfo) {
      if (accessToken && fullName) {
        authButtons.style.display = "none";
        userInfo.style.display = "block";
        userInfo.innerHTML = `Welcome, ${fullName}! <button id="logout-button">Logout</button>`;

        // Add event listener to the logout button
        const logoutButton = document.getElementById("logout-button");
        if (logoutButton) {
          logoutButton.addEventListener("click", handleLogout);
        } else {
          console.error("Logout button not found after adding to DOM");
        }
      } else {
        authButtons.style.display = "block";
        userInfo.style.display = "none";
        userInfo.innerHTML = "";
      }
    } else {
      console.error("Auth buttons or user info div not found");
    }
  }

  // Logout function
  function handleLogout() {
    console.log("Logging out");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("fullName");
    updateAuthUI();
    window.location.href = "/login";
  }

  // Fetch books from the backend
  async function fetchBooks(page = 1, pageSize = 10, query = "") {
    const booksList = document.getElementById("books-list");
    const errorDiv = document.getElementById("error");
    booksList.innerHTML = '<div class="loading">Loading books...</div>';
    errorDiv.innerHTML = '';

    try {
      const accessToken = localStorage.getItem("accessToken");
      const url = `/proxy/books?page=${page}&page_size=${pageSize}${query ? `&q=${encodeURIComponent(query)}` : ''}`;
      console.log('Fetching books URL:', url);

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
        if (response.status === 401 && accessToken) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("fullName");
          updateAuthUI();
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log("Books response:", data);

      booksList.innerHTML = "";
      if (!data.results || data.results.length === 0) {
        booksList.innerHTML = "<p>No books found.</p>";
        updatePagination(1, 1);
        return;
      }

      const baseUrl = "http://159.89.108.157:8000";
      data.results.forEach((book) => {
        const imageUrl = book.first_page_image
          ? book.first_page_image.startsWith("http")
            ? book.first_page_image
            : `${baseUrl}${book.first_page_image}`
          : null;

        const pdfUrl = book.pdf
          ? book.pdf.startsWith("http")
            ? book.pdf
            : `${baseUrl}${book.pdf}`
          : null;

        const imageHtml = imageUrl
          ? `<img src="${imageUrl}" alt="${
              book.name || "Book cover"
            }" onerror="this.src='https://via.placeholder.com/150?text=Image+Not+Found'">`
          : '<p class="not-found">Not found</p>';

        const pdfHtml = pdfUrl
          ? `<a class="download-button" href="${pdfUrl}" download>Download</a>`
          : '<p class="not-found">Not found</p>';

        // Comments button (visible only if authenticated)
        const commentsHtml = accessToken
          ? `<a class="comments-button" href="/details?bookId=${book.id}">Comments</a>`
          : '';

        const bookDiv = document.createElement("div");
        bookDiv.className = "book-item";
        bookDiv.innerHTML = `
          <h3>${book.name || "No title"}</h3>
          ${imageHtml}
          <div class="book-details">
            <p>Created: ${book.created_at || "N/A"}</p>
            <p>Updated: ${book.updated_at || "N/A"}</p>
            ${pdfHtml}
            ${commentsHtml}
          </div>
        `;
        booksList.appendChild(bookDiv);
      });

      updatePagination(page, Math.ceil(data.count / pageSize));
    } catch (error) {
      booksList.innerHTML = "";
      errorDiv.innerText = `Error fetching books: ${error.message}`;
      console.error("Fetch books error:", error);
      if (error.message.includes("Session expired")) {
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    }
  }

  // Update pagination controls
  function updatePagination(currentPage, totalPages) {
    const paginationDiv = document.getElementById("pagination");
    paginationDiv.innerHTML = "";

    const prevButton = document.createElement("button");
    prevButton.innerText = "Previous";
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener("click", () => fetchBooks(currentPage - 1));
    paginationDiv.appendChild(prevButton);

    for (let i = 1; i <= totalPages; i++) {
      const pageButton = document.createElement("button");
      pageButton.innerText = i;
      pageButton.className = i === currentPage ? "active" : "";
      pageButton.addEventListener("click", () => fetchBooks(i));
      paginationDiv.appendChild(pageButton);
    }

    const nextButton = document.createElement("button");
    nextButton.innerText = "Next";
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener("click", () => fetchBooks(currentPage + 1));
    paginationDiv.appendChild(nextButton);
  }

  // Handle search
  function handleSearch() {
    const searchInput = document.getElementById("search-input");
    const query = searchInput.value.trim();
    fetchBooks(1, 10, query);
  }

  // Attach event listeners
  const searchButton = document.querySelector(".search-container button");
  if (searchButton) {
    searchButton.addEventListener("click", handleSearch);
  } else {
    console.error("Search button not found");
  }

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    });
  } else {
    console.error("Search input not found");
  }

  // Initialize page
  updateAuthUI();
  fetchBooks();
});