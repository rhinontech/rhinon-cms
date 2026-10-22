import {
  ChevronLeft,
  Divide,
  EllipsisVertical,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import './NewsScreen.scss';
import { resolveS3Key, getInitialSrc } from '@/utils/s3KeyResolver';

// New imports from restructured modules
import type { NewsItem, ChatbotConfig, NewsScreenProps } from '@/types';

const news: NewsItem[] = [
  {
    title: 'Interview Update Request',
    content:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Hic, iste! Rerum placeat alias aliquam, delectus sint accusamus non earum obcaecati incidunt, nesciunt quae! Nostrum consequatur, deleniti aliquam amet distinctio alias, quaerat laudantium quo illo numquam soluta incidunt culpa eveniet quidem explicabo dolor optio nulla vel consectetur pariatur odit veniam provident.',
    img: 'https://media.istockphoto.com/id/1435220822/photo/african-american-software-developer.jpg?s=612x612&w=0&k=20&c=JESGRQ2xqRH9ZcJzvZBHZIZKVY8MDejBSOfxeM-i5e4=',
    tags: ['Fin Tech', 'New Feature'],
    authorImg:
      'https://i.pinimg.com/736x/eb/76/a4/eb76a46ab920d056b02d203ca95e9a22.jpg',
    authorName: 'Julio',
    updatedAt: '2 month ago',
  },
  {
    title: 'Interview Update Request',
    content:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Hic, iste! Rerum placeat alias aliquam, delectus sint accusamus non earum obcaecati incidunt, nesciunt quae! Nostrum consequatur, deleniti aliquam amet distinctio alias, quaerat laudantium quo illo numquam soluta incidunt culpa eveniet quidem explicabo dolor optio nulla vel consectetur pariatur odit veniam provident.',
    img: 'https://media.istockphoto.com/id/1435220822/photo/african-american-software-developer.jpg?s=612x612&w=0&k=20&c=JESGRQ2xqRH9ZcJzvZBHZIZKVY8MDejBSOfxeM-i5e4=',
    tags: ['Fin Tech', 'New Feature'],
    authorImg:
      'https://i.pinimg.com/736x/eb/76/a4/eb76a46ab920d056b02d203ca95e9a22.jpg',
    authorName: 'Julio',
    updatedAt: '2 month ago',
  },
  {
    title: 'Interview Update Request',
    content:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Hic, iste! Rerum placeat alias aliquam, delectus sint accusamus non earum obcaecati incidunt, nesciunt quae! Nostrum consequatur, deleniti aliquam amet distinctio alias, quaerat laudantium quo illo numquam soluta incidunt culpa eveniet quidem explicabo dolor optio nulla vel consectetur pariatur odit veniam provident.',
    img: 'https://media.istockphoto.com/id/1435220822/photo/african-american-software-developer.jpg?s=612x612&w=0&k=20&c=JESGRQ2xqRH9ZcJzvZBHZIZKVY8MDejBSOfxeM-i5e4=',
    tags: ['Fin Tech', 'New Feature'],
    authorImg:
      'https://i.pinimg.com/736x/eb/76/a4/eb76a46ab920d056b02d203ca95e9a22.jpg',
    authorName: 'Julio',
    updatedAt: '2 month ago',
  },
];

const NewsScreen: React.FC<NewsScreenProps> = ({
  chatbot_config,
  setSelectedNews,
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
  };

  const handleMaxScreen = () => {
    setMaxScreen(true);
  };
  const handleMinScreen = () => {
    setMaxScreen(false);
  };

  const handleNewsClick = (items: any) => {
    setSelectedNews(items);
    // setWindowWidth("700px")
  };

  return (
    <div className='news-screen-container'>
      {/* header */}
      <div className='news-header'>
        {/* <div
                    onClick={handleOnBack}
                    style={{
                        cursor: 'pointer',
                        height: 36,
                        width: 36,
                        border: '1px solid #BEBEBE',
                        borderRadius: 8,
                        display: 'flex',
                        position:'relative',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex:10
                    }}
                >
                    <ChevronLeft size={18} />
                </div> */}

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

        {/* {(selectedNews && maxScreen) && <button onClick={handleMinScreen} className='header-btn' style={{ border: 'none', background: 'transparent' }}>
                    <Minimize2 size={18} />
                </button>}
                {(!maxScreen && selectedNews) && <button className='header-btn' style={{ border: 'none', background: 'transparent', position:'relative', zIndex:10 }}>
                    <Maximize2 onClick={handleMaxScreen} size={18} />
                </button>} */}
        {/* <button className='header-btn'>
          <EllipsisVertical size={18} />
        </button> */}
      </div>

      <div className='news-container'>
        {news.map((items, index) => (
          <div
            onClick={() => handleNewsClick(items)}
            className='news-box'
            key={index}
            style={{ ['--primary-color' as any]: chatbot_config.primaryColor }}
          >
            <div className='img-container'>
              <img className='news-img' src={items.img} alt='news-img' />
            </div>
            <div className='tags-container'>
              {items.tags.map((tag, index) => (
                <div className='tag' key={index}>
                  {tag}
                </div>
              ))}
            </div>
            <h2 className='news-title'>{items.title}</h2>
            <p className='news-para'>
              If you need any help with your questions or issues, I'm here to
              help you. Would you like...
            </p>
          </div>
        ))}
      </div>
      {/* {selectedNews &&
                <div ref={boxRef} className='item-container' style={{ position: 'relative' }}>
                    <div className='item-img-container'>
                        <img className='item-img' src={selectedNews.img} alt="item-img" />
                    </div>
                    <div className='tags-container'>
                        {selectedNews.tags.map((tag: any, index: any) => (
                            <div className='tag' key={index}>
                                {tag}
                            </div>
                        ))}
                    </div>
                    <div className='item-title'>
                        <h2 style={{padding:0, margin:0, marginBottom:'10px'}} >{selectedNews.title}</h2>
                        <div
                            style={{
                                display: 'flex',
                                gap: "20px",
                                height: '55px'
                            }}
                        >
                            <div
                                style={{
                                    width: '55px',
                                    height: '55px',
                                    overflow: 'hidden',
                                    borderRadius: "100%"
                                }}
                            >
                                <img
                                    style={{
                                        width: "100p%",
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                    src={selectedNews.authorImg} alt="author-img" />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '5px' }}>
                                <p style={{ padding: '0px', margin: '0px', color: '#3e3e3eff' }}>Written by {selectedNews.authorName}</p>
                                <p style={{ padding: '0px', margin: '0px', color: '#3e3e3eff' }}>Updated over {selectedNews.updatedAt}</p>
                            </div>
                        </div>
                    </div>
                    <div className='item-content'>
                        <p>{selectedNews.content}</p>
                    </div>

                </div>} */}
    </div>
  );
};

export default NewsScreen;
