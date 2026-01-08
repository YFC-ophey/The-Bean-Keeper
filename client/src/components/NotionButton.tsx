import React from 'react';

/**
 * NotionButton - Clean, minimal Notion integration button
 * Matches Notion's official design language: simple, professional, confident
 */

export default function NotionButton() {
  const notionUrl = "https://www.notion.so/opheliayfchen/a12cbbbcb1a4421d83f02fac3436c39d?v=04b501d749ef4201b184d89b21d9868b&source=copy_link";

  return (
    <a
      href={notionUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-1.5 px-3 py-1.5
        bg-white hover:bg-[#F7F6F5]
        border border-[#E3E2E0] hover:border-[#D3D2CF]
        rounded-md
        text-[#37352F] text-sm font-medium
        no-underline
        transition-all duration-150 ease-out
        shadow-[0_1px_2px_rgba(0,0,0,0.05)]
        hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#000000]
        shrink-0"
    >
      {/* Text */}
      <span className="text-[13px] tracking-[-0.01em] font-normal">
        Connect to
      </span>

      {/* Notion logo - simplified reliable version */}
      <svg
        className="shrink-0 w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-105"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
      </svg>
    </a>
  );
}
