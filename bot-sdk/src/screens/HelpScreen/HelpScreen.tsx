import React, { useEffect, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, FileText, Search, X } from 'lucide-react';
import './HelpScreen.scss';
import { Loader } from '@/components/common';
import { resolveS3Key, getInitialSrc } from '@/utils/s3KeyResolver';

// New imports from restructured modules
import type { Article, Folder, HelpScreenProps } from '@/types';
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

  const query = searchQuery.trim().toLowerCase();
  // Searching looks across every collection, so a visitor needn't guess which one.
  const results = query
    ? folders.flatMap((folder) =>
        (folder.articles || [])
          .filter((article) => article.title.toLowerCase().includes(query))
          .map((article) => ({ article, folder })),
      )
    : [];
  const visibleFolders = folders.filter((folder) => (folder.articles || []).length > 0);
  const articleCount = visibleFolders.reduce((n, f) => n + f.articles.length, 0);
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

  const ArticleRow = ({ article, folderName }: { article: Article; folderName?: string }) => (
    <button type='button' className='rh-help-article' onClick={() => setSelectedHelpArticle(article)}>
      <span className='rh-help-article-icon'>
        <FileText size={15} />
      </span>
      <span className='rh-help-article-text'>
        <span className='rh-help-article-title'>{article.title}</span>
        {folderName && <span className='rh-help-article-sub'>{folderName}</span>}
      </span>
      <ChevronRight size={16} className='rh-help-chevron' />
    </button>
  );

  return (
    <div className='rh-help'>
      {/* Top bar */}
      <div className='rh-help-bar'>
        {selectedHelp ? (
          <button type='button' className='rh-icon-btn' onClick={() => setSelectedHelp(null)} aria-label='Back to all collections'>
            <ChevronLeft size={18} />
          </button>
        ) : null}
        <img className='rh-help-logo' src={resolvedSecondaryLogo || chatbot_config?.secondaryLogo} alt='' />
      </div>

      <div className='rh-help-scroll'>
        {/* Hero: title + search, or the open collection */}
        <div className='rh-help-hero'>
          {selectedHelp ? (
            <>
              <span className='rh-help-hero-icon'>
                <BookOpen size={18} />
              </span>
              <h2>{selectedHelp.name}</h2>
              {selectedHelp.description && <p>{selectedHelp.description}</p>}
              <span className='rh-help-meta'>{plural(selectedHelp.articles.length, 'article')}</span>
            </>
          ) : (
            <>
              <h2>How can we help?</h2>
              <p>
                {articleCount
                  ? `${plural(articleCount, 'answer')} from the ${chatbot_config?.chatbotName || 'support'} team`
                  : 'Answers to common questions'}
              </p>
              <label className='rh-help-search'>
                <Search size={16} />
                <input
                  type='text'
                  placeholder='Search articles'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type='button' onClick={() => setSearchQuery('')} aria-label='Clear search'>
                    <X size={14} />
                  </button>
                )}
              </label>
            </>
          )}
        </div>

        <div className='rh-help-body'>
          {loading ? (
            <div className='rh-help-loading'>
              <Loader />
            </div>
          ) : selectedHelp ? (
            <div className='rh-help-group'>
              {selectedHelp.articles.map((article) => (
                <ArticleRow key={article.articleId} article={article} />
              ))}
            </div>
          ) : query ? (
            results.length ? (
              <>
                <p className='rh-help-label'>{plural(results.length, 'result')}</p>
                <div className='rh-help-group'>
                  {results.map(({ article, folder }) => (
                    <ArticleRow key={article.articleId} article={article} folderName={folder.name} />
                  ))}
                </div>
              </>
            ) : (
              <div className='rh-empty'>
                <p className='rh-empty-title'>No articles match “{searchQuery.trim()}”</p>
                <p className='rh-empty-sub'>Try other words, or ask in the chat.</p>
              </div>
            )
          ) : visibleFolders.length ? (
            <>
              <p className='rh-help-label'>Collections</p>
              <div className='rh-help-folders'>
                {visibleFolders.map((folder) => (
                  <button type='button' key={folder.folderId} className='rh-help-folder' onClick={() => setSelectedHelp(folder)}>
                    <span className='rh-help-folder-icon'>
                      <BookOpen size={16} />
                    </span>
                    <span className='rh-help-folder-text'>
                      <span className='rh-help-folder-name'>{folder.name}</span>
                      {folder.description && <span className='rh-help-folder-desc'>{folder.description}</span>}
                      <span className='rh-help-meta'>{plural(folder.articles.length, 'article')}</span>
                    </span>
                    <ChevronRight size={16} className='rh-help-chevron' />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className='rh-empty'>
              <p className='rh-empty-title'>No help articles yet</p>
              <p className='rh-empty-sub'>Ask in the chat instead — we&apos;re happy to help.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpScreen;
