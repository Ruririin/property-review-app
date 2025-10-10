import SlideOne from '../pages/slides/SlideOne';
import SlideTwo from '../pages/slides/SlideTwo';
import SlideThree from '../pages/slides/SlideThree';
import StreetView from '../pages/slides/StreetView';
import Interior from '../pages/slides/Interior';
import OnlinePresence from '../pages/slides/OnlinePresence';
import License from '../pages/slides/License';
import Comments from '../pages/slides/Comments';

import FireHazard from '../pages/slides/FireHazard';
import CrimeRate from '../pages/slides/CrimeRate';
import NearestFireStation from '../pages/slides/NearestFireStation';
import Website from '../pages/slides/Website';
import Ratings from '../pages/slides/Ratings';

export default function SlideRenderer({ slideData, slideProps, slideComponentRefs, getSlideData, slideId }) {
  const slideType = slideData?.type;

  switch (slideType) {
    case 'cover':
      return <SlideOne {...slideProps} ref={(el) => { slideComponentRefs.current[slideId] = el; }} />;

    case 'aerial_view_-_google':
      return <SlideTwo {...slideProps} ref={(el) => { slideComponentRefs.current[slideId] = el; }} />;

    case 'aerial_view_-_bing':
      return <SlideThree {...slideProps} ref={(el) => { slideComponentRefs.current[slideId] = el; }} />;

    case 'parcel_info':
      return <SlideThree {...slideProps} ref={(el) => { slideComponentRefs.current[slideId] = el; }} />;

    case 'street_view':
      return <StreetView {...slideProps} ref={(el) => { slideComponentRefs.current[slideId] = el; }} />;

    case 'interior':
      return <Interior {...slideProps} ref={(el) => { slideComponentRefs.current[slideId] = el; }} />;

    case 'online_presence':
      return <OnlinePresence {...slideProps} ref={(el) => { slideComponentRefs.current[slideId] = el; }} />;

    case 'license':
      return <License {...slideProps} ref={(el) => { slideComponentRefs.current[slideId] = el; }} />;

    case 'comments':
      return <Comments {...slideProps} ref={(el) => { slideComponentRefs.current[slideId] = el; }} />;

    case 'fire_hazard':
      return <FireHazard {...slideProps} ref={(el) => { slideComponentRefs.current[slideId] = el; }} />;

    case 'crime_rate':
      return <CrimeRate {...slideProps} ref={(el) => { slideComponentRefs.current[slideId] = el; }} />;

    case 'nearest_fire_station':
      return <NearestFireStation {...slideProps} ref={(el) => { slideComponentRefs.current[slideId] = el; }} />;

    case 'website':
      // Pass website data from slide 1 (first slide) using getSlideData function
      const slide1FormData = getSlideData(1)?.formData || {};
      const websiteData = slide1FormData.website || '';
      return <Website {...slideProps} websiteUrl={websiteData} ref={(el) => { slideComponentRefs.current[slideId] = el; }} />;

    case 'ratings':
      return <Ratings {...slideProps} ref={(el) => { slideComponentRefs.current[slideId] = el; }} />;

    default:
      // If it's slide 1, always render as SlideOne (property information)
      if (slideId === 1) {
        return <SlideOne {...slideProps} ref={(el) => { slideComponentRefs.current[slideId] = el; }} />;
      }

      return (
        <div className="d-flex justify-content-center align-items-center h-100" style={{ width: '1280px', height: '720px' }}>
          <div className="text-center text-muted">
            <h3>{slideData.title}</h3>
            <p>This slide will be implemented soon</p>
          </div>
        </div>
      );
  }
}