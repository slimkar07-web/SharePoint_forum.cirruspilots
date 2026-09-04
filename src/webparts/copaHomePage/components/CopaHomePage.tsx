import * as React from 'react';
import { Icon } from '@fluentui/react';
import styles from './CopaHomePage.module.scss';
import type { ICopaHomePageProps } from './ICopaHomePageProps';
import { TopicList } from './TopicList/TopicList';
import { CreatePost } from './CreatePost/CreatePost';
import { ForumService } from '../../../services/ForumService';
import { ITopic } from '../../../models/ITopic';
import { ICategory } from '../../../models/ICategory';

export interface ICopaHomePageState {
  isHamburgerOpen: boolean;
  isCategoryOpen: boolean;
  isSearchOpen: boolean;
  searchQuery: string;
  selectedCategory: string;
  selectedTab: 'latest' | 'top';
  topics: ITopic[];
  categories: ICategory[];
  isLoading: boolean;
  isCategoriesLoading: boolean;
}

export default class CopaHomePage extends React.Component<ICopaHomePageProps, ICopaHomePageState> {
  private _forumService: ForumService;
  private _containerRef: React.RefObject<HTMLDivElement>;

  constructor(props: ICopaHomePageProps) {
    super(props);
    this.state = {
      isHamburgerOpen: false,
      isCategoryOpen: false,
      isSearchOpen: false,
      searchQuery: '',
      selectedCategory: 'All Categories',
      selectedTab: 'latest',
      topics: [],
      categories: [],
      isLoading: true,
      isCategoriesLoading: true
    };
    this._forumService = new ForumService(props.context);
    this._containerRef = React.createRef<HTMLDivElement>();
  }

  public async componentDidMount(): Promise<void> {
    document.addEventListener('mousedown', this.handleClickOutside);
    void this._loadCategories();
    void this._loadTopics(this.state.selectedCategory);
  }

  public componentDidUpdate(prevProps: ICopaHomePageProps, prevState: ICopaHomePageState): void {
    if (prevState.selectedCategory !== this.state.selectedCategory) {
      void this._loadTopics(this.state.selectedCategory);
    }
  }

  public componentWillUnmount(): void {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  private handleClickOutside = (event: MouseEvent) => {
    if (this._containerRef.current && !this._containerRef.current.contains(event.target as Node)) {
      if (this.state.isCategoryOpen || this.state.isHamburgerOpen || this.state.isSearchOpen) {
        this.setState({
          isCategoryOpen: false,
          isHamburgerOpen: false,
          isSearchOpen: false
        });
      }
    }
  }

  private async _loadCategories(): Promise<void> {
    this.setState({ isCategoriesLoading: true });
    const categories = await this._forumService.getCategories();
    this.setState({ categories, isCategoriesLoading: false });
  }

  private async _loadTopics(category: string): Promise<void> {
    this.setState({ isLoading: true });
    const topics = await this._forumService.getTopics(category);
    this.setState({ topics, isLoading: false });
  }

  private toggleHamburger = () => {
    this.setState({ isHamburgerOpen: !this.state.isHamburgerOpen, isCategoryOpen: false, isSearchOpen: false });
  }

  private toggleSearch = () => {
    this.setState({ isSearchOpen: !this.state.isSearchOpen, isHamburgerOpen: false, isCategoryOpen: false });
  }

  private handleCreatePost = async (title: string, body: string, categoryId: number, files: File[]) => {
    // We pass categoryId so ForumService can link it to the lookup column in SharePoint
    const newTopic = await this._forumService.createTopic({ title, body, category: 'Loading...' }, files, categoryId);
    if (newTopic) {
      // Refresh topics or just prepend it to the list
      this.setState(prevState => ({
        topics: [newTopic, ...prevState.topics]
      }));
    }
  }

  private handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ searchQuery: event.target.value });
  }

  private handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Close the search dropdown to show the filtered results
    this.setState({ isSearchOpen: false });
  }

  private toggleCategory = () => {
    this.setState({ isCategoryOpen: !this.state.isCategoryOpen, isHamburgerOpen: false, isSearchOpen: false });
  }

  private setCategory = (cat: string) => {
    this.setState({ selectedCategory: cat, isCategoryOpen: false });
  }

  private setTab = (tab: 'latest' | 'top') => {
    this.setState({ selectedTab: tab });
  }

  public render(): React.ReactElement<ICopaHomePageProps> {
    // First, filter by search query if one exists
    const query = this.state.searchQuery.trim().toLowerCase();
    const filteredTopics = query 
      ? this.state.topics.filter(t => 
          (t.title && t.title.toLowerCase().includes(query)) || 
          (t.body && t.body.toLowerCase().includes(query))
        )
      : this.state.topics;

    const sortedTopics = [...filteredTopics].sort((a, b) => {
      if (this.state.selectedTab === 'top') {
        // Sort by total engagement (likes + replies + views)
        const engagementA = (a.likesCount || 0) + (a.repliesCount || 0) + (a.viewsCount || 0);
        const engagementB = (b.likesCount || 0) + (b.repliesCount || 0) + (b.viewsCount || 0);
        return engagementB - engagementA;
      } else {
        // Default to 'latest'
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      }
    });

    return (
      <section className={`${styles.copaHomePage}`} ref={this._containerRef}>
        <header className={styles.header}>
          <div className={styles.logoArea}>
            {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
            <img src={require('../assets/logo.png')} alt="COPA Logo" className={styles.logo} />
          </div>
          <div className={styles.navActions}>

            <div className={styles.searchContainer}>
              <Icon iconName="Search" className={styles.iconSearch} onClick={this.toggleSearch} />
              {this.state.isSearchOpen && (
                <div className={styles.searchDropdown}>
                  <form onSubmit={this.handleSearchSubmit} className={styles.searchForm}>
                    <input 
                      type="text" 
                      placeholder="Search topics, categories, or users..." 
                      className={styles.searchInput}
                      value={this.state.searchQuery}
                      onChange={this.handleSearchChange}
                      autoFocus
                    />
                    <button type="submit" className={styles.searchButton}>
                      <Icon iconName="Search" />
                    </button>
                  </form>
                  <div className={styles.searchQuickLinks}>
                    <a href="https://forum.cirruspilots.org/search?q=status:open"><Icon iconName="Message" /> Open topics</a>
                    <a href="https://forum.cirruspilots.org/search?q=has:solution"><Icon iconName="SkypeCircleCheck" /> Solved topics</a>
                    <a href="https://forum.cirruspilots.org/search-advanced"><Icon iconName="Settings" /> Advanced Search</a>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.hamburgerContainer}>
              <Icon iconName="GlobalNavButton" className={styles.iconMenu} onClick={this.toggleHamburger} />
              {this.state.isHamburgerOpen && (
                <div className={styles.hamburgerDropdown}>
                  <div className={styles.hamburgerGrid}>
                    <div className={styles.hamburgerCol}>
                      <a href="https://forum.cirruspilots.org/latest"><Icon iconName="ViewAll" /> Topics</a>
                      <a href="https://forum.cirruspilots.org/faq"><Icon iconName="Help" /> Guidelines</a>
                      <a href="https://forum.cirruspilots.org/badges"><Icon iconName="Ribbon" /> Badges</a>
                    </div>
                    <div className={styles.hamburgerCol}>
                      <a href="https://forum.cirruspilots.org/about"><Icon iconName="Info" /> About</a>
                      <a href="https://forum.cirruspilots.org/g"><Icon iconName="Group" /> Groups</a>
                      <a href="https://forum.cirruspilots.org/search"><Icon iconName="Filter" /> Filter</a>
                    </div>
                  </div>
                  <div className={styles.hamburgerSection}>
                    <h4>QUICK NAVIGATION</h4>
                    <div className={styles.hamburgerGrid}>
                      <div className={styles.hamburgerCol}>
                        <a href="https://forum.cirruspilots.org/latest"><Icon iconName="Calendar" /> Latest</a>
                        <a href="https://forum.cirruspilots.org/unread"><Icon iconName="Inbox" /> Unread</a>
                      </div>
                      <div className={styles.hamburgerCol}>
                        <a href="https://forum.cirruspilots.org/new"><Icon iconName="Ringer" /> New</a>
                        <a href="https://forum.cirruspilots.org/my/activity"><Icon iconName="Contact" /> My posts</a>
                      </div>
                    </div>
                  </div>
                  <div className={styles.hamburgerSection}>
                    <h4>CATEGORIES</h4>
                    <div className={styles.categoryGrid}>
                      {this.state.categories.map(cat => (
                        <a key={cat.id} href="#" onClick={(e) => { e.preventDefault(); this.setCategory(cat.title); this.setState({isHamburgerOpen: false}); }}>
                          <span className={styles.catSquare} style={{backgroundColor: cat.colorHex}} /> {cat.title}
                        </a>
                      ))}
                      <a href="#" onClick={(e) => { e.preventDefault(); this.setCategory('All Categories'); this.setState({isHamburgerOpen: false}); }}><Icon iconName="List" /> All categories</a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={styles.mainContent}>
          <div className={styles.heroBanner}>
            <h2>Welcome to the shield forum!</h2>
            <a href="https://cirruspilots.org/Join" className={styles.btnJoinCopa}>Join Shield</a>
          </div>

          <div className={styles.categoryNav}>
            <div className={styles.categorySelect} onClick={this.toggleCategory}>
              <span className={styles.catSquare} style={{backgroundColor: this.state.categories.find(c => c.title === this.state.selectedCategory)?.colorHex || '#333'}}></span>
              {this.state.selectedCategory}
              <Icon iconName="ChevronDown" className={styles.chevron} />
              
              {this.state.isCategoryOpen && (
                <div className={styles.categoryDropdown}>
                  <div className={styles.categoryItem} onClick={(e) => { e.stopPropagation(); this.setCategory('All Categories'); }}>
                    <div className={styles.catItemTitle}>All Categories</div>
                  </div>
                  {this.state.categories.map(cat => (
                    <div className={styles.categoryItem} key={cat.id} onClick={(e) => { e.stopPropagation(); this.setCategory(cat.title); }}>
                      <div className={styles.catItemTitle}>
                        <span className={styles.catSquare} style={{backgroundColor: cat.colorHex}}></span>
                        {cat.title}
                      </div>
                      {cat.description && <div className={styles.catItemDesc}>{cat.description}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.tabs}>
              <button className={`${styles.tabBtn} ${this.state.selectedTab === 'latest' ? styles.activeTab : ''}`} onClick={() => this.setTab('latest')}>Latest</button>
              <button className={`${styles.tabBtn} ${this.state.selectedTab === 'top' ? styles.activeTab : ''}`} onClick={() => this.setTab('top')}>Top</button>
            </div>

            <button className={styles.btnViewToggle}>
              <Icon iconName="List" />
            </button>
          </div>

          {this.state.isLoading ? (
            <div style={{color: '#fff', padding: '20px'}}>Loading topics...</div>
          ) : (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <CreatePost 
                categories={this.state.categories} 
                onCreatePost={this.handleCreatePost}
                currentUserDisplayName={this.props.context.pageContext.user.displayName}
              />
              <TopicList 
                topics={sortedTopics} 
                forumService={this._forumService}
                currentUserDisplayName={this.props.context.pageContext.user.displayName}
              />
            </div>
          )}
        </div>
      </section>
    );
  }
}
