async function getBooks() {
  let books = localStorage.getItem('books');

  if (!books) {
    let response = await fetch('./books.json');
    let books = await response.json();
    localStorage.setItem('books', JSON.stringify(books));
    return books;
  } else {
    return JSON.parse(books);
  }
}

class BookManager {
  constructor(data=[], filter='all') {
    this.books = data;
    this.filter = filter;
  }
  getStats() {
    return this.books.reduce((stats, book) => {
      stats[book.status] = (stats[book.status] || 0) + 1;
      stats.total += 1;
      return stats;
    }, {total: 0});
  }
  setFilter(filter) {
    this.filter = filter;
  }
  
  getBooks(searchTerm) {
    let current = [];
    if (this.filter === 'all') {
      current = this.books;
    } else if (this.filter === 'read') {
      current = this.books.filter(book => book.status === 'read');
    } else if (this.filter === 'unread') {
      current = this.books.filter(book => book.status === 'unread');
    }
    if (searchTerm) { 
      searchTerm = searchTerm.toLowerCase();
      current = current.filter(book => book.title.toLowerCase().includes(searchTerm));
    }
    return current;
  }
  addBook({id, status, title, author}) {
    if (id === undefined) {
      id = this.getNextId();
    }

    let book = {
      id,
      status,
      title,
      author
    }
    this.books.push(book);
    localStorage.setItem('books', JSON.stringify(this.books));
    return book;
  }
  getNextId() {
    return Math.max(...this.books.map(book => book.id), this.books.length) + 1;
  }
  deleteBook(id) {
    let book = this.books.find(book => book.id === id);
    if (book) {
      this.books = this.books.filter(book => book.id !== id);
      localStorage.setItem('books', JSON.stringify(this.books));
    }
  }
  toggleRead(id) {
    let book = this.books.find(book => book.id === id);
    if (book) {
      book.status = book.status === 'read' ? 'unread' : 'read';
      localStorage.setItem('books', JSON.stringify(this.books));
    }
  }
}

function bookTemplate(bookData) {
  let li = document.createElement('li');
  li.setAttribute(`data-id`, bookData.id);
  li.classList.add('book')
  li.classList.add(bookData.status);

  let read = document.createElement('input');
  read.setAttribute('type', 'checkbox');
  read.checked = bookData.status === 'read' ? true : false;
  li.appendChild(read);

  let title = document.createElement('p');
  title.textContent = `${bookData.title}`;
  li.appendChild(title);

  let author = document.createElement('p');
  author.textContent = `by ${bookData.author}`;
  li.appendChild(author);

  let deleteButton = document.createElement('button');
  deleteButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17 17L7 7.00002M17 7L7.00001 17"stroke-width="2" stroke-linecap="round"/>
</svg>`
  deleteButton.classList.add('delete');
  li.appendChild(deleteButton);

  return li;
}

function renderBooks(books) {
  let bookList = document.getElementById('book-list');
  bookList.innerHTML = '';
  books.forEach(book => {
    bookList.appendChild(bookTemplate(book));
  });
}

function bindBooks(bookManager) {
  let bookList = document.getElementById('book-list');
  bookList.addEventListener('click', (e) => handleBookListClick(e, bookManager));
}

function handleBookListClick(e, bookManager) {
  e.preventDefault();
  let li = e.target.closest('li');
  let button = e.target.closest('button');

  if (!li) return;
  let id = Number(li.dataset.id);

  if (button) {
    bookManager.deleteBook(id);
    e.stopPropagation();  
  } else {
    bookManager.toggleRead(id);
  }

  renderLibrary(bookManager);
  return;
}

function showAddBookForm(e) {
  let modal = document.querySelector('.overlay');
  modal.classList.remove('hidden');
}

function hideModal(e) {
  let modal = document.querySelector('.overlay');
  if (e.target === modal || e.target.id === 'cancel') {
    modal.classList.add('hidden');
  }
  return;
}

function handleSubmitForm(e, bookManager) {
  e.preventDefault();
  let formData = Object.fromEntries(new FormData(e.currentTarget));
  formData.status = formData.status === 'on' ? 'read' : 'unread';
  bookManager.addBook(formData);
  renderLibrary(bookManager);
}

function handleFilterChange(e, bookManager) {
  let filter = e.target.value;
  localStorage.setItem('filter', filter);
  bookManager.setFilter(filter);
  renderLibrary(bookManager);
}

function renderStats(bookManager) {
  let stats = bookManager.getStats();

  let totalBooks = document.getElementById('totalBooks');
  let totalRead = document.getElementById('totalRead');
  let totalUnread = document.getElementById('totalUnread');
  totalBooks.textContent = stats.total;
  totalRead.textContent = stats.read;
  totalUnread.textContent = stats.unread;
}

function renderLibrary(bookManager, searchTerm) {
  renderStats(bookManager);
  renderBooks(bookManager.getBooks(searchTerm));
}

function valueChanged(e, bookManager) {
  let searchTerm = e.target.value;

  if (searchTerm.length > 0) {
    renderLibrary(bookManager, searchTerm);
  } else {
    renderLibrary(bookManager)
  }
}


async function main() {
  let savedFilter = localStorage.getItem('filter') || 'all';
  let readFilter = document.getElementById('book-filter');
  readFilter.value = savedFilter;
  let bookManager = new BookManager(await getBooks(), savedFilter);
  renderLibrary(bookManager)

  bindBooks(bookManager);

  let overlay = document.querySelector('.overlay');
  overlay.addEventListener('click', hideModal);

  let newBookButton = document.getElementById('newBook');
  newBookButton.addEventListener('click', showAddBookForm);

  let form = document.querySelector('form');
  form.addEventListener('submit', (e) => handleSubmitForm(e, bookManager));


  readFilter.addEventListener('change', (e) => handleFilterChange(e, bookManager));

  let searchBar = document.getElementById('search');
  searchBar.addEventListener('input', (e) => valueChanged(e, bookManager));
}



document.addEventListener('DOMContentLoaded', main);