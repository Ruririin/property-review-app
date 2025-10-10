import { useState } from 'react';

export const useEditorStateSimple = () => {
  const [slides, setSlides] = useState([{ id: 1, type: 'cover', title: 'Cover Page' }]);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [nextSlideId, setNextSlideId] = useState(2);
  const [slideData, setSlideData] = useState({
    1: {
      formData: {
        insuredName: "",
        website: "",
        description: "",
        lineBusiness: "",
        websiteInfo: "",
      },
      imageData: null,
      imagePosition: { top: 300, left: 400 },
      drawings: [],
      fieldPositions: {
        insuredName: { top: 180, right: 124 },
        premiseLocation: { top: 310, right: 124 },
        website: { top: 370, right: 124 },
        description: { top: 430, right: 124 },
        lineBusiness: { top: 526, right: 124 },
        isoClass: { top: 490, right: 124 },
      }
    }
  });
  const [globalLocationData, setGlobalLocationData] = useState({
    premiseLocation: "",
  });
  const [fieldPositions, setFieldPositions] = useState({});
  const [multipleLocationsMode, setMultipleLocationsMode] = useState(false);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(0);
  const [slideTypeCounts, setSlideTypeCounts] = useState({
    street_view: 0
  });
  const [isProjectModified, setIsProjectModified] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);

  return {
    slides,
    setSlides,
    currentSlide,
    setCurrentSlide,
    nextSlideId,
    setNextSlideId,
    slideData,
    setSlideData,
    globalLocationData,
    setGlobalLocationData,
    fieldPositions,
    setFieldPositions,
    multipleLocationsMode,
    setMultipleLocationsMode,
    selectedLocationIndex,
    setSelectedLocationIndex,
    slideTypeCounts,
    setSlideTypeCounts,
    isProjectModified,
    setIsProjectModified,
    lastSaveTime,
    setLastSaveTime
  };
};