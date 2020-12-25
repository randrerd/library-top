//DOM Cache
const mainContainer = document.querySelector('.mainContainer');
const authUIContainer = document.querySelector('#firebaseUIContainer');
const libraryContainer = document.querySelector('.libraryContainer');
const booksWrapper = document.querySelector('.booksWrapper');
const booksWrapperChildren = booksWrapper.childNodes;
const addBookContainer = document.querySelector('.addBookContainer');
const noBooksText = document.querySelector('.noBooksText');

const newBookBtn = document.querySelector('.newBookBtn');
const titleInput = document.querySelector('#titleInput');
const authorInput = document.querySelector('#authorInput');
const pagesInput = document.querySelector('#pagesInput');
const readInput = document.querySelector('#readInput');
const submitBtn = document.querySelector('#submitBtn');

//Event listeners
newBookBtn.addEventListener('click', () => newBookBtnHandler());
submitBtn.addEventListener('click', () => submitBtnHandler());

//Events handlers
const newBookBtnHandler = () => {
  addBookContainer.classList.toggle('hidden');
  addBookContainer.classList.toggle('flex');
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

    if (!noBooksText.classList.contains('hidden')) {
      noBooksText.classList.add('hidden');
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

    readRefToUpdate.once('value', (read) => {
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
    child.attributes['data-key'].value == key ? (boolean = true) : null
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
  const bookContainer = document.createElement('div');
  const titleElement = document.createElement('h3');
  const authorElement = document.createElement('p');
  const pagesElement = document.createElement('p');
  const readElement = document.createElement('p');
  const removeBookBtn = document.createElement('button');
  const readBtn = document.createElement('button');

  //Adds CSS classes
  bookContainer.classList.add('bookContainer');
  titleElement.classList.add('bookTitle');
  authorElement.classList.add('author');
  pagesElement.classList.add('pages');
  readElement.classList.add('read');
  removeBookBtn.classList.add('removeBook');
  readBtn.classList.add('readBtn');

  bookContainer.setAttribute('data-key', key);

  //Adds content to HTML elements
  titleElement.innerText = title;
  authorElement.innerText = author;
  pagesElement.innerText = `${pages} pages long`;
  readElement.innerText = read ? `You've read it` : `You haven't read it`;
  removeBookBtn.innerText = 'x';
  readBtn.innerText = read ? `Actually, haven't read it` : `I read it!`;

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

  removeBookBtn.addEventListener('click', (e) => {
    removeBookBtnHandler(e, key);
  });

  readBtn.addEventListener('click', (e) => {
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
  booksRef.once('value', (snapshot) => {
    if (!snapshot.val()) {
      showElement(noBooksText);
    } else {
      snapshot.forEach((childSnapshot) => {
        renderBook(childSnapshot);
      });
    }
  });

  //Renders new books
  booksRef.on('child_added', (data) => {
    //If noBooksText showing, hides it since it's first book added
    if (noBooksText.style.display !== 'none') {
      hideElement(noBooksText);
    }
    renderBook(data);
  });

  //Removes recently removed book element from books container
  booksRef.on('child_removed', (data) => {
    const keyToRemove = data.key;
    booksWrapper.childNodes.forEach((child) => {
      if (child.attributes['data-key'].value == keyToRemove) {
        child.remove();
      }
    });
  });

  booksRef.on('child_changed', (data) => {
    const keyToUpdate = data.key;
    //Replaces old book element with updated one
    booksWrapper.childNodes.forEach((child) => {
      if (child.attributes['data-key'].value == keyToUpdate) {
        child.replaceWith(createBookElement(data));
      }
    });
  });
};

const firebaseUtils = (() => {
  //Database and auth related

  const firebaseConfig = {
    apiKey: 'AIzaSyD_p_4zadDzyQKdUc8-uY7aQJKA5z_i3rE',
    authDomain: 'library-34c68.firebaseapp.com',
    databaseURL: 'https://library-34c68-default-rtdb.firebaseio.com',
    projectId: 'library-34c68',
    storageBucket: 'library-34c68.appspot.com',
    messagingSenderId: '493185594001',
    appId: '1:493185594001:web:c697332eea069666178530',
    measurementId: 'G-GL71KNJPD6',
  };

  firebase.initializeApp(firebaseConfig);
  firebase.analytics();

  const uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: (authResult) => signInHandler(authResult),
    },
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
      firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID,
    ],
    tosUrl: null,
    privacyPolicyUrl: null,
  };

  // Initialize the FirebaseUI Widget using Firebase.
  const ui = new firebaseui.auth.AuthUI(firebase.auth());

  ui.start('#firebaseUIContainer', uiConfig);

  firebase.auth().onAuthStateChanged((user) => {
    const firebaseUIContainer = document.querySelector('#firebaseUIContainer');
    //Hides Auth UI when user logged in and shows library
    if (user) {
      hideElement(firebaseUIContainer);
      displayBooks();
      showElement(libraryContainer);
      const { displayName } = user;
      const authCTA = document.querySelector('.authCTA');
      authCTA.innerText = !displayName
        ? 'Hello stranger!'
        : `Hello ${displayName}`;
    }
  });

  const signInHandler = async (authResult) => {
    const { displayName, email, uid } = authResult.user;
    const isNewUser = authResult.additionalUserInfo.isNewUser;
    //Stores data of new user on database
    if (isNewUser) {
      firebase
        .database()
        .ref('users/' + uid)
        .set({
          displayName: !displayName ? 'Anon' : displayName,
          email: !email ? 'notProvided' : email,
        });
    }
    showElement(libraryContainer, true);
    hideElement(authUIContainer);
    return false;
  };
})();

const showElement = (element, flex = false) => {
  if (flex) {
    element.style.display = 'flex';
  } else {
    element.style.display = 'block';
  }
};
const hideElement = (element) => {
  element.style.display = 'none';
};
