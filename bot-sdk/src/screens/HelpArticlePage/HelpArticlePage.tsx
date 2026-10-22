import React, { useState, useEffect } from 'react';
import { ChevronLeft, Maximize2, Minimize2, ThumbsDown, ThumbsUp } from 'lucide-react';
import './HelpArticlePage.scss';
import { resolveS3Key, getInitialSrc } from '@/utils/s3KeyResolver';
import { resolveImagesInHTML } from '@/utils/htmlImageResolver';
import { Loader } from '@/components/common';
import { getArticle, sendArticleFeedback } from '@/services/help';

// New imports from restructured modules
import type { Article, ChatbotConfig, HelpArticlePageProps } from '@/types';

const HelpArticlePage: React.FC<HelpArticlePageProps> = ({
  chatbot_config,
  setWindowWidth,
  setSelectedHelpArticle,
  selectedHelpArticle,
}) => {
  const [maxScreen, setMaxScreen] = useState<boolean>(false);
  const [resolvedSecondaryLogo, setResolvedSecondaryLogo] = useState<string>(() => getInitialSrc(chatbot_config?.secondaryLogo));
  const [processedContent, setProcessedContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState<boolean>(true);

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

  // The Help list carries titles only: fetch the body (this also counts the view).
  useEffect(() => {
    let cancelled = false;
    const processContent = async () => {
      setLoadingContent(true);
      let html = selectedHelpArticle?.content || '';
      if (!html && selectedHelpArticle?.articleId) {
        html = await getArticle(selectedHelpArticle.articleId).then((a) => a.content || '').catch(() => '');
      }
      const resolved = html ? await resolveImagesInHTML(html) : '';
      if (cancelled) return;
      setProcessedContent(resolved);
      setLoadingContent(false);
    };
    processContent();
    return () => {
      cancelled = true;
    };
  }, [selectedHelpArticle?.articleId, selectedHelpArticle?.content]);

  const voteKey = `rh-article-vote-${selectedHelpArticle?.articleId}`;
  const [vote, setVote] = useState<'up' | 'down' | null>(() => {
    try {
      return (localStorage.getItem(voteKey) as 'up' | 'down' | null) || null;
    } catch {
      return null;
    }
  });
  const handleVote = (v: 'up' | 'down') => {
    if (vote || !selectedHelpArticle?.articleId) return;
    setVote(v);
    try {
      localStorage.setItem(voteKey, v);
    } catch {
      // Private mode: the vote still counts, it just isn't remembered.
    }
    void sendArticleFeedback(selectedHelpArticle.articleId, v === 'up');
  };

  const handleOnBack = () => {
    setSelectedHelpArticle(null);
    setWindowWidth('400px');
  };

  const handleMaxScreen = () => {
    setMaxScreen(true);
    setWindowWidth('700px');
  };

  const handleMinScreen = () => {
    setMaxScreen(false);
    setWindowWidth('400px');
  };

  const updated = (() => {
    const t = Date.parse(selectedHelpArticle.updated_at);
    if (Number.isNaN(t)) return '';
    const days = Math.floor((Date.now() - t) / 86_400_000);
    if (days < 1) return 'Updated today';
    if (days === 1) return 'Updated yesterday';
    if (days < 30) return `Updated ${days} days ago`;
    return `Updated ${new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  })();

  return (
    <div className='rh-help rh-article'>
      <div className='rh-help-bar'>
        <button type='button' className='rh-icon-btn' onClick={handleOnBack} aria-label='Back'>
          <ChevronLeft size={18} />
        </button>
        <img className='rh-help-logo' src={resolvedSecondaryLogo || chatbot_config?.secondaryLogo} alt='' />
        <button
          type='button'
          className='rh-icon-btn rh-help-bar-end'
          onClick={maxScreen ? handleMinScreen : handleMaxScreen}
          aria-label={maxScreen ? 'Make smaller' : 'Make bigger'}
        >
          {maxScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      <div className='rh-help-scroll'>
        <article className='rh-article-body'>
          <h1 className='rh-article-title'>{selectedHelpArticle.title}</h1>
          {updated && <p className='rh-help-meta'>{updated}</p>}

          {loadingContent ? (
            <div className='rh-help-loading'>
              <Loader />
            </div>
          ) : (
            <>
              <div className='rh-article-content' dangerouslySetInnerHTML={{ __html: processedContent }} />
              <div className='rh-article-feedback'>
                {vote ? (
                  <p>{vote === 'up' ? 'Glad it helped 🎉' : 'Thanks — we’ll improve this article.'}</p>
                ) : (
                  <>
                    <p>Was this article helpful?</p>
                    <div>
                      <button type='button' onClick={() => handleVote('up')} aria-label='Yes, helpful'>
                        <ThumbsUp size={15} /> Yes
                      </button>
                      <button type='button' onClick={() => handleVote('down')} aria-label='Not helpful'>
                        <ThumbsDown size={15} /> No
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </article>
      </div>
    </div>
  );
};

export default HelpArticlePage;
