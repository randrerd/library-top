//DOM Cache
const mainContainer = document.querySelector(".main-container");
const authUIContainer = document.querySelector(".main-auth-container");
const libraryContainer = document.querySelector(".main-library-container");
const booksWrapper = document.querySelector(".main-books-wrapper");
const booksWrapperChildren = booksWrapper.childNodes;
const addBookContainer = document.querySelector("#modal-add-book-container");
const noBooksText = document.querySelector("#library-no-books");
const newBookBtn = document.querySelector(".btn-library-newbook");
const titleInput = document.querySelector("#titleInput");
const authorInput = document.querySelector("#authorInput");
const pagesInput = document.querySelector("#pagesInput");
const readInput = document.querySelector("#readInput");
const addBookBtn = document.querySelector(".btn-library-addbook");
const closeAddBookContainerBtn = document.querySelector("#close-addbook-modal");

//Event listeners
newBookBtn.addEventListener("click", () => newBookBtnHandler());
addBookBtn.addEventListener("click", () => submitBtnHandler());
closeAddBookContainerBtn.addEventListener("click", () =>
  closeAddBookContainerBtnHandler()
);
addBookContainer.addEventListener("click", (e) =>
  closeModalHandler(addBookContainer, e.target)
);

//Event handlers
const newBookBtnHandler = () => {
  addBookContainer.style.visibility = "visible";
  addBookContainer.style.opacity = 1;
};

const closeAddBookContainerBtnHandler = () => {
  addBookContainer.style.visibility = "hidden";
  addBookContainer.style.opacity = 0;
};
const submitBtnHandler = async () => {
  const title = titleInput.value;
  const author = authorInput.value;
  const pages = pagesInput.value;
  const read = readInput.checked;

  //Adds data to database only if all fields filled
  if (title && author && pages) {
    const user = firebase.auth().currentUser;
    const { uid } = user;
    const newBook = new Book(title, author, pages, read);
    const booksRef = firebase.database().ref(`users/${uid}/books`);
    const newBookRef = booksRef.push();
    newBookRef.set(newBook);
    closeAddBookContainerBtnHandler();

    if (!noBooksText.classList.contains("hidden")) {
      noBooksText.classList.add("hidden");
    }
  }
};

const removeBookBtnHandler = async (e, key) => {
  try {
    const userId = firebase.auth().currentUser.uid;
    const bookRefToDelete = await firebase
      .database()
      .ref(`users/${userId}/books/${key}`);

    bookRefToDelete.remove();
  } catch (err) {
    console.log(err);
  }
};

const readBtnHandler = async (e, key) => {
  try {
    const userId = firebase.auth().currentUser.uid;
    const readRefToUpdate = await firebase
      .database()
      .ref(`users/${userId}/books/${key}/read`);

    readRefToUpdate.once("value", (read) => {
      //Reads the current value of read boolean and toggles it
      read.val() ? readRefToUpdate.set(false) : readRefToUpdate.set(true);
    });
  } catch (err) {
    console.log(err);
  }
};

function Book(title, author, pages, read) {
  this.title = title;
  this.author = author;
  this.pages = pages;
  this.read = read;
}

const isBookRendered = (key) => {
  let boolean = false;

  booksWrapperChildren.forEach((child) =>
    child.attributes["data-key"].value == key ? (boolean = true) : null
  );

  return boolean;
};

const renderBook = (childSnapshot) => {
  //Checks if book already rendered
  if (!isBookRendered(childSnapshot.key)) {
    const bookContainer = createBookElement(childSnapshot);
    booksWrapper.appendChild(bookContainer);
  }
};

const createBookElement = (childSnapshot) => {
  const { title, author, pages, read } = childSnapshot.val();
  const key = childSnapshot.key;

  //Creates HTML elements
  const bookContainer = document.createElement("div");
  const titleElement = document.createElement("h3");
  const authorElement = document.createElement("p");
  const pagesElement = document.createElement("p");
  const readElement = document.createElement("p");
  const removeBookBtn = document.createElement("button");
  const readBtn = document.createElement("button");

  //Adds CSS classes
  bookContainer.className = "main-books-container";
  removeBookBtn.className = "btn-times";
  removeBookBtn.id = "btn-remove-book";
  readBtn.className = "btn-read";

  bookContainer.setAttribute("data-key", key);

  //Adds content to HTML elements
  titleElement.innerText = title;
  authorElement.innerText = author;
  pagesElement.innerText = `${pages} pages long`;
  readElement.innerText = read ? `You've read it` : `You haven't read it`;
  removeBookBtn.innerText = "x";
  readBtn.innerText = read ? `Haven't read it` : `I read it!`;

  const content = [
    removeBookBtn,
    titleElement,
    authorElement,
    pagesElement,
    readElement,
    readBtn,
  ];
  content.forEach((element) => {
    bookContainer.appendChild(element);
  });

  removeBookBtn.addEventListener("click", (e) => {
    removeBookBtnHandler(e, key);
  });

  readBtn.addEventListener("click", (e) => {
    readBtnHandler(e, key);
  });
  return bookContainer;
};

const getStoredBooks = async () => {
  try {
    const userId = firebase.auth().currentUser.uid;
    const storedBooksRef = await firebase
      .database()
      .ref(`users/${userId}/books`);

    return storedBooksRef;
  } catch (err) {
    console.log(err);
  }
};

const displayBooks = async () => {
  const booksRef = await getStoredBooks();

  //Renders books for first time
  booksRef.once("value", (snapshot) => {
    if (!snapshot.val()) {
      showElement(noBooksText);
    } else {
      snapshot.forEach((childSnapshot) => {
        renderBook(childSnapshot);
      });
    }
  });

  //Renders new books
  booksRef.on("child_added", (data) => {
    //If noBooksText showing, hides it since it's first book added
    if (noBooksText.style.display !== "none") {
      hideElement(noBooksText);
    }
    renderBook(data);
  });

  //Removes recently removed book element from books container
  booksRef.on("child_removed", (data) => {
    const keyToRemove = data.key;
    booksWrapper.childNodes.forEach((child) => {
      if (child.attributes["data-key"].value == keyToRemove) {
        child.remove();
      }
    });
  });

  booksRef.on("child_changed", (data) => {
    const keyToUpdate = data.key;
    //Replaces old book element with updated one
    booksWrapper.childNodes.forEach((child) => {
      if (child.attributes["data-key"].value == keyToUpdate) {
        child.replaceWith(createBookElement(data));
      }
    });
  });
};

const firebaseUtils = (() => {
  //DOM Cache
  const mainHeading = document.querySelector(".main-heading");
  const authErrorElement = document.querySelector(".main-auth-error");
  const authBtnWrapper = document.querySelector(".main-auth-btn-wrapper");
  const logInAsGuestBtn = document.querySelector(".btn-login-guest");
  const logInWithEmailtBtn = document.querySelector("#btn-login-email");
  const emailLogInWrapper = document.querySelector(
    ".main-auth-email-login-wrapper"
  );
  const emailLoginInput = document.querySelector("#auth-login-email-input");
  const passwordLoginInput = document.querySelector(
    "#auth-login-password-input"
  );
  const displayNameLoginInput = document.querySelector(
    "#auth-email-login-name-input"
  );
  const checkEmailBtn = document.querySelector("#auth-email-submit");
  const setDisplayNameInputWrapper = document.querySelector(
    ".input-wrapper-email-login-name"
  );
  const passwordLoginInputWrapper = document.querySelector(
    ".input-wrapper-email-login-password"
  );
  const submitSignupBtn = document.querySelector("#auth-email-signup-submit");
  const submitLoginBtn = document.querySelector("#auth-email-login-submit");

  const signOutBtn = document.querySelector("#sign-out");

  const convertAccountBtn = document.querySelector("#btn-convert-account");
  const convertAccountForm = document.querySelector("#modal-convert-form");
  const convertAccountSubmitBtn = document.querySelector(
    "#auth-convert-submit-btn"
  );
  const modalContainer = document.querySelector("#modal-convert-account");
  const closeModalBtn = document.querySelector("#modal-btn-close");

  //Creates error message element for account conversion
  const errorMsgElement = document.createElement("p");
  errorMsgElement.className = "errorMsg";
  convertAccountForm.appendChild(errorMsgElement);

  //Event listeners
  logInAsGuestBtn.addEventListener("click", () => logInAsGuestHandler());
  logInWithEmailtBtn.addEventListener("click", () =>
    logInWithEmailBtnHandler()
  );
  checkEmailBtn.addEventListener("click", () => checkEmailBtnHandler());
  submitSignupBtn.addEventListener("click", () => submitSignupBtnHandler());
  submitLoginBtn.addEventListener("click", () => submitLoginBtnHandler());

  signOutBtn.addEventListener("click", () => signOutHandler());
  convertAccountBtn.addEventListener("click", () => convertHandler());
  convertAccountSubmitBtn.addEventListener("click", () =>
    convertAccountSubmitHandler()
  );
  closeModalBtn.addEventListener("click", () =>
    closeModalHandler(modalContainer)
  );
  modalContainer.addEventListener("click", (e) =>
    closeModalHandler(modalContainer, e.target)
  );

  const logInAsGuestHandler = async () => {
    try {
      const firebaseAuth = firebase.auth();
      const anonymousAccount = await firebaseAuth.signInAnonymously();
    } catch (err) {
      console.log(err);
    }
  };
  const logInWithEmailBtnHandler = () => {
    hideElement(authBtnWrapper);
    showElement(emailLogInWrapper, true);
  };

  const checkEmailBtnHandler = async () => {
    const emailInput = emailLoginInput.value;

    try {
      const usersRef = await firebase.database().ref("users");
      const isEmailValid = validateEmail(emailInput);

      if (!isEmailValid) {
        handleError(authErrorElement, { code: "auth/invalid-email" });
      } else {
        usersRef
          .orderByChild("email")
          .equalTo(emailInput)
          .once("value", (val) => callback(val));

        const callback = (user) => {
          const isUserRegistered = !user.val() ? false : true;

          hideElement(checkEmailBtn);
          console.log(isUserRegistered);
          if (isUserRegistered) {
            submitLoginBtn.setAttribute("type", "submit");
            checkEmailBtn.setAttribute("type", "button");
            passwordLoginInputWrapper.classList.add("show");
            submitLoginBtn.classList.add("show");
          } else {
            //Shows display name, password and sign up button
            displayNameLoginInput.setAttribute("required", "");
            passwordLoginInput.setAttribute("required", "");
            checkEmailBtn.setAttribute("type", "button");
            submitSignupBtn.setAttribute("type", "submit");
            setDisplayNameInputWrapper.classList.add("show");
            setTimeout(() => {
              passwordLoginInputWrapper.classList.add("show");
            }, 500);
            setTimeout(() => {
              submitSignupBtn.classList.add("show");
            }, 1000);
          }
        };
      }
    } catch (err) {
      console.log(err);
    }
  };

  const storeUserDb = async () => {
    try {
      const user = firebase.auth().currentUser;
      const { uid, displayName, isAnonymous, email } = user;
      const usersRef = firebase.database().ref(`users/${uid}`);
      console.log(user);
      if (!isAnonymous) {
        const newEntry = await usersRef.set({ displayName, email });
      } else {
        const newEntry = await usersRef.set({ displayName: "Anon" });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const submitSignupBtnHandler = async () => {
    const submittedEmail = emailLoginInput.value;
    const submittedPassword = passwordLoginInput.value;
    const submittedName = displayNameLoginInput.value;

    try {
      const firebaseAuth = firebase.auth();
      const accountCreation = await firebaseAuth.createUserWithEmailAndPassword(
        submittedEmail,
        submittedPassword
      );

      const setDisplayName = await updateDisplayName(submittedName);
      storeUserDb();
    } catch (err) {
      handleError(authErrorElement, err);
    }
  };

  const submitLoginBtnHandler = async () => {
    const submittedEmail = emailLoginInput.value;
    const submittedPassword = passwordLoginInput.value;

    try {
      const firebaseAuth = firebase.auth();
      const userLogin = await firebaseAuth.signInWithEmailAndPassword(
        submittedEmail,
        submittedPassword
      );
    } catch (err) {
      handleError(authErrorElement, err);
    }
  };

  const updateDisplayName = async (displayName) => {
    try {
      const user = firebase.auth().currentUser;
      const displayNameUpdate = await user.updateProfile({ displayName });
    } catch (err) {
      console.log(err);
    }
  };

  //Database and auth related

  const firebaseConfig = {
    apiKey: "AIzaSyD_p_4zadDzyQKdUc8-uY7aQJKA5z_i3rE",
    authDomain: "library-34c68.firebaseapp.com",
    databaseURL: "https://library-34c68-default-rtdb.firebaseio.com",
    projectId: "library-34c68",
    storageBucket: "library-34c68.appspot.com",
    messagingSenderId: "493185594001",
    appId: "1:493185594001:web:c697332eea069666178530",
    measurementId: "G-GL71KNJPD6",
  };

  firebase.initializeApp(firebaseConfig);
  firebase.analytics();

  firebase.auth().onAuthStateChanged((user) => {
    //Hides Auth UI when user logged in and shows library

    //Waits to make sure it has the updated user information
    if (user) {
      setTimeout(() => {
        hideElement(authUIContainer);
        hideElement(mainHeading);
        displayBooks();
        showElement(libraryContainer, true);
        showElement(signOutBtn);
        const { displayName, isAnonymous } = user;
        const greetingElement = document.querySelector("#library-greeting");
        greetingElement.innerText = isAnonymous
          ? "Hello stranger!"
          : `Hello ${displayName}`;

        if (isAnonymous) {
          showElement(convertAccountBtn);
        }
      }, 500);
    }
  });

  const signOutHandler = async () => {
    try {
      const auth = firebase.auth();
      const signOut = await auth.signOut();
      location.reload();
    } catch (err) {
      console.log(err);
    }
  };

  const convertHandler = () => {
    modalContainer.style.visibility = "visible";
    modalContainer.style.opacity = 1;
  };

  const convertAccountSubmitHandler = async () => {
    //DOM Cache
    const displayNameInput = document.querySelector("#auth-convert-name-input");
    const emailInput = document.querySelector("#auth-convert-email-input");
    const passwordInput = document.querySelector(
      "#auth-convert-password-input"
    );

    try {
      const credential = firebase.auth.EmailAuthProvider.credential(
        emailInput.value,
        passwordInput.value
      );
      //Gets current anon user
      const currentUser = firebase.auth().currentUser;
      //Links it with credentials from user input
      const usercred = await currentUser.linkWithCredential(credential);
      const updateDisplayName = await currentUser.updateProfile({
        displayName: displayNameInput.value,
      });
      const user = usercred.user;

      //Hides the modal after it's done
      modalContainer.style.visibility = "hidden";
      modalContainer.style.opacity = 0;
      location.reload();
    } catch (err) {
      handleError(errorMsgElement, err);
    }
  };
})();

const showElement = (element, flex = false) => {
  if (flex) {
    element.style.display = "flex";
  } else {
    element.style.display = "block";
  }
};
const hideElement = (element) => {
  element.style.display = "none";
};
const closeModalHandler = (modal, target = null) => {
  const modalContainer = modal;

  if (!target || target.classList.contains("modal")) {
    modalContainer.style.visibility = "hidden";
    modalContainer.style.opacity = 0;
  }
};
const handleError = (errorElement, err) => {
  errorElement.innerText = "";
  const errorMessages = [
    {
      errorCode: "auth/invalid-email",
      message: "Invalid e-mail address, please try again",
    },
    {
      errorCode: "auth/weak-password",
      message:
        "Password should be at least 6 characters long, please try again",
    },
    {
      errorCode: "auth/wrong-password",
      message: "Wrong password, please try again",
    },
    {
      errorCode: "auth/too-many-requests",
      message: "Too many requests, please wait and try again",
    },
    {
      errorCode: "auth/user-not-found",
      message: "User not found with given email address",
    },
  ];
  const { code } = err;

  const currentError = errorMessages.filter(
    (object) => object.errorCode === code
  )[0];

  errorElement.innerText = currentError.message;
};
const validateEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};
