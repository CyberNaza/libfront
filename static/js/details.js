document.addEventListener("DOMContentLoaded", () => {
  console.log("details.js loaded");

  // Function to get CSRF token from cookie
  function getCsrfToken() {
    const name = "csrftoken";
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + "=")) {
        return cookie.substring(name.length + 1);
      }
    }
    return null;
  }

  // Function to format relative time
  function getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.round(diffMs / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 60) {
      return `${diffSeconds} seconds ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
    }
  }

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

  // Check authentication
  const accessToken = localStorage.getItem("accessToken");
  console.log("Access token:", accessToken);
  if (!accessToken) {
    console.log("No access token found, redirecting to login");
    window.location.href = "/login";
    return;
  }

  // Get book ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get("bookId");
  if (!bookId) {
    console.error("Book ID not provided");
    document.getElementById("error").innerText = "Error: Book ID not provided.";
    return;
  }
  console.log("Book ID:", bookId);

  // Function to render comments
  function renderComments(comments) {
    const commentsList = document.getElementById("comments-list");
    const errorDiv = document.getElementById("error");
    if (!commentsList || !errorDiv) {
      console.error("Comments list or error div not found");
      return;
    }

    commentsList.innerHTML = '<div class="loading">Loading comments...</div>';
    console.log("Comments to render:", comments);

    try {
      commentsList.innerHTML = "";
      if (!Array.isArray(comments) || comments.length === 0) {
        commentsList.innerHTML = "<p>No comments yet.</p>";
        return;
      }

      comments.forEach((comment, index) => {
        const commentDiv = document.createElement("div");
        commentDiv.className = "comment-item";

        // Truncate long comments
        const maxDisplayLength = 200;
        const fullText = comment.text || "No content";
        const isLongComment = fullText.length > maxDisplayLength;
        const shortText = isLongComment ? fullText.substring(0, maxDisplayLength) + "..." : fullText;

        // Format the timestamp as relative time
        const date = comment.created_at ? new Date(comment.created_at) : null;
        const formattedDate = date ? getRelativeTime(date) : "N/A";

        // Create a unique ID for toggling
        const toggleId = `comment-${index}`;

        commentDiv.innerHTML = `
          <p><strong>${comment.owner?.full_name || "Anonymous"}:</strong> <span id="${toggleId}-text">${shortText}</span>
            ${isLongComment ? `<a href="#" class="toggle-comment" data-id="${toggleId}" data-full="${fullText}" data-short="${shortText}">[Show more]</a>` : ''}
          </p>
          <p class="comment-timestamp">Posted: ${formattedDate}</p>
        `;
        commentsList.appendChild(commentDiv);
      });

      // Add event listeners for "Show more" links
      document.querySelectorAll(".toggle-comment").forEach(link => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const toggleId = link.getAttribute("data-id");
          const fullText = link.getAttribute("data-full");
          const shortText = link.getAttribute("data-short");
          const textSpan = document.getElementById(`${toggleId}-text`);

          if (link.textContent === "[Show more]") {
            textSpan.textContent = fullText;
            link.textContent = "[Show less]";
          } else {
            textSpan.textContent = shortText;
            link.textContent = "[Show more]";
          }
        });
      });
    } catch (error) {
      commentsList.innerHTML = "";
      errorDiv.innerText = `Error rendering comments: ${error.message}`;
      console.error("Render comments error:", error);
    }
  }

  // Fetch book details and comments
  async function fetchBookDetails() {
    const bookDetailsDiv = document.getElementById("book-details");
    const errorDiv = document.getElementById("error");
    const likesCountDiv = document.getElementById("likes-count");
    if (!bookDetailsDiv || !errorDiv || !likesCountDiv) {
      console.error("Book details, error, or likes count div not found");
      return;
    }

    bookDetailsDiv.innerHTML = '<div class="loading">Loading book details...</div>';
    errorDiv.innerHTML = '';

    try {
      const url = `/proxy/books/${bookId}/`;
      console.log('Fetching book URL:', url);

      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      };
      console.log("Request headers:", headers);

      const response = await fetch(url, {
        method: "GET",
        headers: headers,
      });

      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.log("Error response text:", errorText);
        if (response.status === 401) {
          console.log("401 Unauthorized, clearing localStorage and redirecting");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("fullName");
          updateAuthUI();
          window.location.href = "/login";
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log("Book details response:", data);

      // Extract book, comments, and likes from the response
      const book = data.book || {};
      const comments = data.comments || [];
      const likes = data.likes || [];
      console.log("Rendering book:", book);
      console.log("Rendering comments:", comments);
      console.log("Rendering likes:", likes);

      // Handle URLs (relative or full)
      const baseUrl = "http://159.89.108.157:8000";
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
        ? `<a class="download-button" href="${pdfUrl}" download>Download</a>`
        : '<p class="not-found">Not found</p>';

      bookDetailsDiv.innerHTML = `
        <div class="book-item">
          ${imageHtml}
          <div class="book-details">
            <h3>${book.name || "No title"}</h3>
            <p>Created: ${book.created_at || "N/A"}</p>
            <p>Updated: ${book.updated_at || "N/A"}</p>
            ${pdfHtml}
          </div>
        </div>
      `;

      // Render likes count and a single Like button
      likesCountDiv.innerHTML = `
        <h3>Likes: ${likes.length}</h3>
        <button id="like-book-button">Like</button>
      `;

      // Add event listener for the Like button
      const likeButton = document.getElementById("like-book-button");
      if (likeButton) {
        likeButton.addEventListener("click", () => likeBook());
      }

      // Render comments
      renderComments(comments);
    } catch (error) {
      console.error("Fetch book error:", error);
      bookDetailsDiv.innerHTML = "";
      errorDiv.innerText = `Error fetching book details: ${error.message}`;
    }
  }

  // Like the book
  async function likeBook() {
    const errorDiv = document.getElementById("error");
    const likeButton = document.getElementById("like-book-button");
    if (!likeButton) {
      console.error("Like button not found");
      return;
    }

    // Add loading state
    likeButton.classList.add("loading");
    likeButton.disabled = true;
    const originalText = likeButton.textContent;

    try {
      const url = `/proxy/books/${bookId}/likes/`;
      console.log('Liking book at URL:', url);

      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-CSRFToken": getCsrfToken(),
      };

      const payload = { comment: parseInt(bookId) }; // Send bookId as "comment"
      console.log("Like payload:", payload);

      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Error response text:", errorText);
        if (response.status === 401) {
          console.log("401 Unauthorized, clearing localStorage and redirecting");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("fullName");
          updateAuthUI();
          window.location.href = "/login";
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      errorDiv.innerText = "";
      fetchBookDetails(); // Refresh book details to update likes count
    } catch (error) {
      errorDiv.innerText = `Error liking book: ${error.message}`;
      console.error("Like book error:", error);
    } finally {
      // Remove loading state
      likeButton.classList.remove("loading");
      likeButton.disabled = false;
      likeButton.textContent = originalText;
    }
  }

  // Post a new comment
  async function postComment() {
    const commentInput = document.getElementById("comment-input");
    const errorDiv = document.getElementById("error");
    const commentButton = document.querySelector("#comment-form button");
    const content = commentInput.value.trim();

    if (!content) {
      errorDiv.innerText = "Comment cannot be empty.";
      return;
    }

    // Enforce a maximum character limit
    const maxLength = 500;
    if (content.length > maxLength) {
      errorDiv.innerText = `Comment is too long. Maximum length is ${maxLength} characters.`;
      return;
    }

    if (!commentButton) {
      console.error("Comment button not found");
      return;
    }

    // Add loading state
    commentButton.classList.add("loading");
    commentButton.disabled = true;
    const originalText = commentButton.textContent;

    try {
      const url = "/proxy/comments/create/";
      console.log('Posting comment to URL:', url);

      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-CSRFToken": getCsrfToken(),
      };

      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ book: parseInt(bookId), text: content }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Error response text:", errorText);
        if (response.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("fullName");
          updateAuthUI();
          window.location.href = "/login";
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      commentInput.value = ""; // Clear input
      errorDiv.innerText = "";
      fetchBookDetails(); // Refresh book details and comments
    } catch (error) {
      errorDiv.innerText = `Error posting comment: ${error.message}`;
      console.error("Post comment error:", error);
    } finally {
      // Remove loading state
      commentButton.classList.remove("loading");
      commentButton.disabled = false;
      commentButton.textContent = originalText;
    }
  }

  // Show comment form for authenticated users
  const commentForm = document.getElementById("comment-form");
  if (accessToken && commentForm) {
    console.log("Showing comment form");
    commentForm.style.display = "block";
  } else {
    console.log("Hiding comment form");
  }

  // Initialize page
  updateAuthUI();
  fetchBookDetails();

  // Make postComment and likeBook available globally
  window.postComment = postComment;
  window.likeBook = likeBook;
});