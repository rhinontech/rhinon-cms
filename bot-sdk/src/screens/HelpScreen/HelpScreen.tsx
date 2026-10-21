import React, { useEffect, useState } from 'react';
import {
  Search,
  EllipsisVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import './HelpScreen.scss';
import { Loader } from '@/components/common';
import { resolveS3Key, getInitialSrc } from '@/utils/s3KeyResolver';

// New imports from restructured modules
import type { Article, Folder, ChatbotConfig, HelpScreenProps } from '@/types';
import { fetchFoldersWithArticles } from '@/services/help';

const HelpScreen: React.FC<HelpScreenProps> = ({
  onNavigate,
  chatbot_config,
  setSelectedHelpArticle,
  setSelectedHelp,
  selectedHelp,
  appId,
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [resolvedSecondaryLogo, setResolvedSecondaryLogo] = useState<string>(() => getInitialSrc(chatbot_config?.secondaryLogo));

  // Fetch folders on mount
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const folders = await fetchFoldersWithArticles(appId);
        setFolders(folders || []);
      } catch (error) {
        console.log('error fetching folders', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, [appId]);

  // Resolve S3 key for secondary logo
  useEffect(() => {
    const resolveLogo = async () => {
      if (chatbot_config?.secondaryLogo) {
        const resolved = await resolveS3Key(chatbot_config.secondaryLogo, null);
        setResolvedSecondaryLogo(resolved);
      }
    };
    resolveLogo();
  }, [chatbot_config?.secondaryLogo]);

  // useEffect(() => {
  //   console.log(folders)
  // }, [folders])

  // Filter folders and articles by search
  const filteredFolders = folders
    .map((folder) => ({
      ...folder,
      articles: (folder.articles || []).filter((article) =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter(
      (folder) =>
        folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        folder.articles.length > 0,
    )
    .filter((folder) => folder.articles.length > 0);


  if (loading) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Loader />
      </div>
    );
  }
  return (
    <div className='chat-list-screen'>
      {/* Header */}
      <div className='news-header'>
        {selectedHelp && (
          <div
            onClick={() => setSelectedHelp(null)}
            style={{
              cursor: 'pointer',
              height: 36,
              width: 36,
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              display: 'flex',
              position: 'relative',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <ChevronLeft size={18} />
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <img
            src={resolvedSecondaryLogo || chatbot_config?.secondaryLogo}
            alt='Rhinon Logo'
            style={{
              maxHeight: '36px',
              maxWidth: '120px',
              objectFit: 'contain',
            }}
          />
        </div>
        {/* <button className='header-btn'>
          <EllipsisVertical size={18} />
        </button> */}
      </div>

      {/* Search + Collection Count */}
      <div className='help-header'>
        <div className='search-box'>
          <input
            type='text'
            style={{ color: 'black' }}
            placeholder='Search for the help...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={16} />
        </div>
        {!selectedHelp && (
          <p
            style={{
              margin: 0,
              padding: 0,
              color: '#8A8A8A',
              marginTop: '14px',
              marginLeft: '10px',
            }}
          >
            {filteredFolders.length} Collections
          </p>
        )}
      </div>

      {/* Folder List */}
      {!selectedHelp && !loading && (
        <div className='help-categories'>
          {filteredFolders.map((folder) => (
            <div
              key={folder.folderId}
              onClick={() => setSelectedHelp(folder)}
              className='help-item'
            >
              <h3>{folder.name}</h3>
              <p>{folder.description || 'No description available'}</p>
              <p
                style={{
                  fontSize: 'small',
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center',
                  paddingRight: 0
                }}
              >
                Created at{' '}
                {folder.createdAt
                  ? new Date(folder.createdAt).toLocaleString()
                  : 'N/A'}
                <span
                  style={{ fontSize: '18px', lineHeight: 0 }}
                  className='dot'
                >
                  •
                </span>
                {folder.articles.length} Articles
              </p>
              <div
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <ChevronRight size={18} />
              </div>
            </div>
          ))}
          {filteredFolders.length === 0 && (
            <p style={{ padding: '10px', color: '#999' }}>
              No folders or articles found.
            </p>
          )}
        </div>
      )}

      {/* Articles inside Folder */}
      {selectedHelp && (
        <div className='help-categories'>
          {/* Folder header */}
          <div
            className='help-item'
            style={{
              background: 'var(--bg-secondary)',
              boxShadow: 'none',
              cursor: 'default',
            }}
          >
            <h3 style={{ fontWeight: 'bold' }}>{selectedHelp.name}</h3>
            <p>{selectedHelp.description || 'No description'}</p>
            <p
              style={{
                fontSize: 'small',
                display: 'flex',
                gap: '5px',
                alignItems: 'center',
                color: '#8A8A8A',
                paddingRight: 0
              }}
            >
              Created at{' '}
              {selectedHelp.createdAt
                ? new Date(selectedHelp.createdAt).toLocaleString()
                : 'N/A'}
              <span style={{ fontSize: '18px', lineHeight: 0 }} className='dot'>
                •
              </span>
              {selectedHelp.articles.length} Articles
            </p>
          </div>

          {/* Articles */}
          {selectedHelp.articles.length === 0 && (
            <p style={{ padding: '10px', color: '#999' }}>
              No articles in this folder.
            </p>
          )}

          {selectedHelp.articles
            .filter((article) =>
              article.title.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((article) => (
              <div
                key={article.articleId}
                onClick={() => setSelectedHelpArticle(article)}
                className='help-item'
                style={{
                  background: 'var(--bg-secondary)',
                  boxShadow: 'none',
                  paddingTop: '20px',
                  paddingBottom: '20px',
                  display: 'flex',
                  flexDirection: 'row',
                }}
              >
                <h3 style={{ flex: 1 }}>{article.title}</h3>
                <ChevronRight size={18} />
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default HelpScreen;
