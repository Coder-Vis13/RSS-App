
import { useState, useEffect } from "react";
import { createFolder } from "../../services/api";
// import { Button } from './ui/button'


interface NewFolder {
  user_id: number;
  folder_id: number;
  name: string;
  created: boolean;
}

export default function CreateFolderPage() {
    const [folder, setFolder] = useState<NewFolder>();
    const [loading, setLoading] = useState(true);
    const userId = 24;
    <section> 
        <div>
            {/* <input
                    type="text"
                    placeholder="Enter the name of the folder"
                    className="border-secondary-border rounded-md border py-1 text-lg h-12 w-96 focus:border--grey px-4outline-none"
                    value={}
                    onChange={(e) => setUrl(e.target.value)}
                    style={{ width: '300px', padding: '5px' }}
                  />
                  <Button 
                  className="py-2 px-4 h-12 rounded-r-md border-secondary-border border flex-shrink-0 bg-[var(--navyblue)] text-[var(--primary-foreground)]"
                  onClick={addSource} 
                  disabled={loadingIcon} 
                  style={{ marginLeft: '10px' }}>
                    {loadingIcon ? (<Loader2 className='h-5 w-5 animate-spin' />
                    ) : ("Add Source")}
                  </Button> */}
        </div>
    </section>

    const folderName = "News";

    useEffect(() => {
        const fetchNewFolder = async () => {
          try {
            const data = await createFolder(userId, folderName);
            setFolder(data);
          } catch (err) {
            console.error("Failed to create folder:", err);
          } finally {
            setLoading(false);
          }
        };
    
        fetchNewFolder();
      }, [userId]);

        if (loading) return <p>Loading read items...</p>;

    return (
        <p>Hello</p>
    )}