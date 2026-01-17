import { useAuth } from '@/context/AuthContext';

/**
 * NotionButton - Notion logo button with dual functionality:
 * - Before login: Triggers Notion OAuth login
 * - After login: Links to user's own Notion database
 */

export default function NotionButton() {
  const { isAuthenticated, isLoading, databaseId, login } = useAuth();

  // Build Notion URL for authenticated users
  const userDatabaseUrl = databaseId
    ? `https://www.notion.so/${databaseId.replace(/-/g, '')}`
    : null;

  // Shared styles for both button and link
  const sharedStyles = `group inline-flex items-center justify-center p-2
    bg-white hover:bg-[#F7F6F5]
    border border-[#E3E2E0] hover:border-[#D3D2CF]
    rounded-md
    text-[#37352F]
    no-underline
    transition-all duration-150 ease-out
    shadow-[0_1px_2px_rgba(0,0,0,0.05)]
    hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#000000]
    shrink-0
    min-h-[36px] min-w-[36px]
    disabled:opacity-50 disabled:cursor-not-allowed`;

  // Notion logo SVG
  const NotionLogo = () => (
    <svg
      className="shrink-0 w-[20px] h-[20px] transition-transform duration-200 group-hover:scale-110"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
    </svg>
  );

  // Before login: Button that triggers OAuth
  if (!isAuthenticated) {
    return (
      <button
        onClick={() => {
          if (!isLoading) {
            login();
          }
        }}
        disabled={isLoading}
        className={sharedStyles}
        aria-label="Connect with Notion"
        title="Connect with Notion"
      >
        <NotionLogo />
      </button>
    );
  }

  // After login: Link to user's database
  return (
    <a
      href={userDatabaseUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={sharedStyles}
      aria-label="Open your Notion database"
      title="Open your Notion database"
    >
      <NotionLogo />
    </a>
  );
}
