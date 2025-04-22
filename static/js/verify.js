document.addEventListener("DOMContentLoaded", () => {
    console.log("verify.js loaded");
  
    const form = document.querySelector("#verifyForm");
    const messageBox = document.getElementById("response-message");
    const submitButton = form.querySelector("button[type='submit']");
    const resendLink = document.getElementById("resend-link");
    const emailInput = document.getElementById("email");
  
    if (!form || !messageBox || !submitButton || !resendLink || !emailInput) {
      console.error("Form, message box, submit button, resend link, or email input not found");
      return;
    }
  
    // Get email from localStorage or URL query parameter
    let email = localStorage.getItem("signupEmail");
    if (!email) {
      const urlParams = new URLSearchParams(window.location.search);
      email = urlParams.get("email");
    }
  
    if (!email) {
      console.error("Email not provided");
      messageBox.style.color = "red";
      messageBox.innerText = "Error: Email not provided. Please sign up first.";
      emailInput.disabled = true;
      submitButton.disabled = true;
      resendLink.style.pointerEvents = "none";
      return;
    }
  
    // Pre-fill email input
    emailInput.value = email;
  
    // Handle verification form submission
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      console.log("Verification form submitted");
  
      const code = document.getElementById("code").value.trim();
  
      if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
        messageBox.style.color = "red";
        messageBox.innerText = "Please enter a valid 6-digit code.";
        return;
      }
  
      // Show loading state
      submitButton.classList.add("loading");
      submitButton.disabled = true;
      submitButton.querySelector("span").innerText = "Loading...";
      messageBox.innerText = "";
  
      const payload = {
        email: email,
        code: code,
      };
  
      console.log("Sending verification request:", payload);
  
      try {
        const response = await fetch(
          "http://192.168.100.63:8000/authonticate/verify-code/", // Updated endpoint
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
  
        console.log("Response status:", response.status);
        const rawResponse = await response.text();
        let data;
        try {
          data = JSON.parse(rawResponse);
          console.log("Response data:", data);
        } catch (jsonError) {
          console.error("Failed to parse JSON:", jsonError.message);
          console.log("Raw response:", rawResponse);
          data = { error: "Invalid server response" };
        }
  
        if (response.ok) {
          messageBox.style.color = "green";
          messageBox.innerText = data.message || "Verification successful! Redirecting...";
          localStorage.removeItem("signupEmail");
          setTimeout(() => {
            console.log("Redirecting to homepage");
            window.location.href = "/";
          }, 1000);
        } else {
          messageBox.style.color = "red";
          let errorMessage = data.message || data.error || "Verification failed.";
          if (response.status === 400) {
            errorMessage = data.error || "Invalid code. Please try again.";
          } else if (response.status === 404) {
            errorMessage = "Endpoint not found. Please check the backend URL.";
          } else if (response.status === 500) {
            errorMessage = "Server error. Please try again later.";
          } else if (typeof data === "object" && !Array.isArray(data)) {
            errorMessage = Object.entries(data)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
              .join("\n");
          }
          messageBox.innerText = errorMessage;
        }
      } catch (err) {
        console.error("Fetch error:", err.message);
        messageBox.style.color = "red";
        messageBox.innerText = `Failed to connect to server: ${err.message}`;
      } finally {
        submitButton.classList.remove("loading");
        submitButton.disabled = false;
        submitButton.querySelector("span").innerText = "Verify";
      }
    });
  
    // Handle resend code link
    resendLink.addEventListener("click", async (event) => {
      event.preventDefault();
      console.log("Resend code clicked");
  
      resendLink.style.pointerEvents = "none";
      resendLink.innerText = "Sending...";
      messageBox.innerText = "";
  
      const payload = {
        email: email,
      };
  
      try {
        const response = await fetch(
          "http://192.168.100.63:8000/authenticate/resend-code/", // Adjust if different
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
  
        console.log("Resend response status:", response.status);
        const rawResponse = await response.text();
        let data;
        try {
          data = JSON.parse(rawResponse);
          console.log("Resend response data:", data);
        } catch (jsonError) {
          console.error("Failed to parse JSON:", jsonError.message);
          console.log("Raw response:", rawResponse);
          data = { error: "Invalid server response" };
        }
  
        if (response.ok) {
          messageBox.style.color = "green";
          messageBox.innerText = data.message || "Verification code resent successfully!";
        } else {
          messageBox.style.color = "red";
          let errorMessage = data.message || data.error || "Failed to resend code.";
          if (response.status === 400) {
            errorMessage = data.error || "Invalid request. Please try again.";
          } else if (response.status === 404) {
            errorMessage = "Endpoint not found. Please check the backend URL.";
          } else if (response.status === 500) {
            errorMessage = "Server error. Please try again later.";
          }
          messageBox.innerText = errorMessage;
        }
      } catch (err) {
        console.error("Resend fetch error:", err.message);
        messageBox.style.color = "red";
        messageBox.innerText = `Failed to connect to server: ${err.message}`;
      } finally {
        resendLink.style.pointerEvents = "auto";
        resendLink.innerText = "Resend code";
      }
    });
  });