import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LibraryStats from './components/LibraryStats';
import LibraryUploadArea from './components/LibraryUploadArea';
import LibraryBookList from './components/LibraryBookList';
import LibraryEditModal from './components/LibraryEditModal';

const Library = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBook, setEditingBook] = useState(null);

  const fetchBooks = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/knowledge', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { 
    fetchBooks(); 
  }, [fetchBooks]);

  return (
    <div className="p-6 text-gray-900 dark:text-gray-100 bg-brand-bg min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">📚 Biblioteca Jurídica</h1>
        <p className="text-sm text-gray-400">Acervo de documentos usado pela IA em cada módulo.</p>
      </div>

      <LibraryStats books={books} />

      <LibraryUploadArea onUploadSuccess={fetchBooks} />

      <LibraryBookList 
        books={books} 
        loading={loading} 
        onBooksChanged={fetchBooks}
        onEditBook={(book) => setEditingBook(book)}
      />

      {editingBook && (
        <LibraryEditModal 
          book={editingBook} 
          onClose={() => setEditingBook(null)}
          onSaved={() => {
            setEditingBook(null);
            fetchBooks();
          }}
        />
      )}
    </div>
  );
};

export default Library;
