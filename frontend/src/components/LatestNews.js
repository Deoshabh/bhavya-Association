import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LatestNews.css';

const LatestNews = () => {
  return (
    <div className="latest-news-events">
      <div className="region region-home-latestnews">
        <div id="block-views-latestnews-new-block-block" className="block block-views first last odd">
          <div className="view view-latestnews-new-block view-id-latestnews_new_block view-display-id-block view-home-tabs view-dom-id-7a3d704ef2f6c0c9d875455275b896f8">
            
            <div className="view-header">
              <div className="latest1">
                <h4>Latest News &amp; Events</h4>
              </div>
            </div>
            
            <div className="view-content">
              <div className="item-list">
                <ul>
                  <li className="views-row views-row-1 views-row-odd views-row-first">
                    <div>
                      <div className="what_new_title">
                        <a href="/press-release">Press Releases by Ministry of MSME</a>
                      </div>
                    </div>
                  </li>
                  <li className="views-row views-row-2 views-row-even views-row-last">
                    <div>
                      <div className="what_new_title">
                        <a href="/pressrelease/photo-gallery">Photo Gallery</a>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="view-footer">
              <div className="custom-view-more">
                <Link to="/latest-events">View All</Link>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestNews;
