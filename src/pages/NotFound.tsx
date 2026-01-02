import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search, Map } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FDF8F3] to-[#F5EDE3]">
        <div className="text-center p-12 rounded-2xl border border-[#E5DFD6] bg-white shadow-xl max-w-lg mx-4">
          <div className="w-24 h-24 mx-auto mb-6 bg-[#794108]/10 rounded-full flex items-center justify-center">
            <span className="text-5xl font-bold text-[#794108]">404</span>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Page Not Found</h1>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
            <br />
            <span className="text-sm text-gray-500">Path: {location.pathname}</span>
          </p>
          
          <div className="space-y-3">
            <Link to="/">
              <Button className="w-full bg-[#794108] hover:bg-[#5a3006]">
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </Link>
            
            <div className="grid grid-cols-2 gap-3">
              <Link to="/app">
                <Button variant="outline" className="w-full">
                  <Map className="w-4 h-4 mr-2" />
                  State Map
                </Button>
              </Link>
              <Link to="/federal">
                <Button variant="outline" className="w-full">
                  <Search className="w-4 h-4 mr-2" />
                  Federal
                </Button>
              </Link>
            </div>
            
            <button 
              onClick={() => window.history.back()}
              className="text-[#794108] hover:text-[#5a3006] text-sm flex items-center justify-center gap-1 w-full mt-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NotFound;
