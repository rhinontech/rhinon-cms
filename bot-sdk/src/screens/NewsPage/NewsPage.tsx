import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  Divide,
  EllipsisVertical,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import './NewsPage.scss';
import { resolveS3Key, getInitialSrc } from '@/utils/s3KeyResolver';

// New imports from restructured modules
import type { NewsItem, ChatbotConfig, NewsPageProps } from '@/types';

const NewsPage: React.FC<NewsPageProps> = ({
  chatbot_config,
  setWindowWidth,
  setSelectedNews,
  selectedNews,
}) => {
  const [maxScreen, setMaxScreen] = useState<boolean>(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [resolvedSecondaryLogo, setResolvedSecondaryLogo] = useState<string>(() => getInitialSrc(chatbot_config.secondaryLogo));

  // Resolve S3 key for secondary logo
  useEffect(() => {
    const resolveLogo = async () => {
      if (chatbot_config.secondaryLogo) {
        const resolved = await resolveS3Key(chatbot_config.secondaryLogo, null);
        setResolvedSecondaryLogo(resolved);
      }
    };
    resolveLogo();
  }, [chatbot_config.secondaryLogo]);

  const handleOnBack = () => {
    setSelectedNews(null);
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

  const handleNewsClick = (items: any) => {
    setSelectedNews(items);
    // setWindowWidth("700px")
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
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <ChevronLeft size={18} />
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <img
            src={resolvedSecondaryLogo || chatbot_config.secondaryLogo}
            alt='Rhinon Logo'
            style={{
              maxHeight: '36px', // fits header height
              maxWidth: '120px', // prevents it from stretching too wide
              objectFit: 'contain', // keeps aspect ratio
            }}
          />
        </div>

        {maxScreen && (
          <button
            onClick={handleMinScreen}
            className='header-btn-extend'
            style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)' }}
          >
            <Minimize2 size={18} />
          </button>
        )}
        {!maxScreen && (
          <button
            className='header-btn-extend'
            style={{
              border: 'none',
              background: 'transparent',
              position: 'relative',
              zIndex: 10,
              color: 'var(--text-primary)'
            }}
          >
            <Maximize2 onClick={handleMaxScreen} size={18} />
          </button>
        )}
        {/* <button className='header-btn'>
          <EllipsisVertical size={18} />
        </button> */}
      </div>


      <div
        ref={boxRef}
        className='item-container'
        style={{ position: 'relative' }}
      >
        <div className='item-img-container'>
          <img className='item-img' src={selectedNews.img} alt='item-img' />
        </div>
        <div className='tags-container'>
          {selectedNews.tags.map((tag: any, index: any) => (
            <div className='tag' key={index}>
              {tag}
            </div>
          ))}
        </div>
        <div className='item-title'>
          <h2 style={{ padding: 0, margin: 0, marginBottom: '10px' }}>
            {selectedNews.title}
          </h2>
          <div
            style={{
              display: 'flex',
              gap: '20px',
              height: '55px',
            }}
          >
            <div
              style={{
                width: '55px',
                height: '55px',
                overflow: 'hidden',
                borderRadius: '100%',
              }}
            >
              <img
                style={{
                  width: '100p%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                src={selectedNews.authorImg}
                alt='author-img'
              />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '5px',
              }}
            >
              <p style={{ padding: '0px', margin: '0px', color: 'var(--text-secondary)' }}>
                Written by {selectedNews.authorName}
              </p>
              <p style={{ padding: '0px', margin: '0px', color: 'var(--text-secondary)' }}>
                Updated over {selectedNews.updatedAt}
              </p>
            </div>
          </div>
        </div>
        <div className='item-content'>
          <p>{selectedNews.content}</p>
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
