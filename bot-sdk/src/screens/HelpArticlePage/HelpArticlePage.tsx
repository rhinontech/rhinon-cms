import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  EllipsisVertical,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import './HelpArticlePage.scss';
import { resolveS3Key, getInitialSrc } from '@/utils/s3KeyResolver';
import { resolveImagesInHTML } from '@/utils/htmlImageResolver';
import { Loader } from '@/components/common';

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

  // Resolve images in article content
  useEffect(() => {
    const processContent = async () => {
      if (selectedHelpArticle?.content) {
        setLoadingContent(true);
        const resolved = await resolveImagesInHTML(selectedHelpArticle.content);
        setProcessedContent(resolved);
        setLoadingContent(false);
      }
    };
    processContent();
  }, [selectedHelpArticle?.content]);

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

  return (
    <div className='news-screen-container'>
      {/* header */}
      <div className='news-header'>
        <div
          onClick={handleOnBack}
          style={{
            cursor: 'pointer',
            height: 36,
            width: 36,
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={18} />
        </div>

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

        {maxScreen ? (
          <button
            onClick={handleMinScreen}
            className='header-btn-extend'
            style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)' }}
          >
            <Minimize2 size={18} />
          </button>
        ) : (
          <button
            onClick={handleMaxScreen}
            className='header-btn-extend'
            style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)' }}
          >
            <Maximize2 size={18} />
          </button>
        )}
        {/* <button className='header-btn'>
          <EllipsisVertical size={18} />
        </button> */}
      </div>

      <div className='item-container'>
        <div className='item-title'>
          <h3>{selectedHelpArticle.title}</h3>
          <p style={{ fontSize: 'small', color: 'var(--text-secondary)' }}>
            Updated{' '}
            {new Date(selectedHelpArticle.updated_at).toLocaleString()}
          </p>
        </div>

        {/* render content as HTML */}
        {loadingContent ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <Loader />
          </div>
        ) : (
          <div
            className='item-content'
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        )}
      </div>
    </div>
  );
};

export default HelpArticlePage;
