'use client';

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Eye, CheckCircle, Users, Clock, Loader2, DollarSign, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";

// Define our lead type from the database
type DBLead = {
  _id: Id<"leads">;
  _creationTime: number;
  name: string;
  budget: string;
  authority: string;
  needs: string;
  timeframe: string;
  createdAt: number;
  language?: string;
}

export default function Dashboard() {
  // Add loading state
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // QR code URL states
  const [englishQRUrl, setEnglishQRUrl] = useState("");
  const [romanianQRUrl, setRomanianQRUrl] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 15;
  
  // Mutation for creating tokens for QR codes
  const createToken = useMutation(api.tokens.createToken);
  
  // Generate tokens and set QR code URLs
  useEffect(() => {
    const generateTokens = async () => {
      if (typeof window !== "undefined") {
        const baseUrl = window.location.origin;
        
        try {
          // Generate English token
          const englishResult = await createToken({
            language: "english",
            clientIp: "",
          });
          
          // Generate Romanian token
          const romanianResult = await createToken({
            language: "romanian",
            clientIp: "",
          });
          
          setEnglishQRUrl(`${baseUrl}/voice-agent?language=english&token=${englishResult.token}`);
          setRomanianQRUrl(`${baseUrl}/voice-agent?language=romanian&token=${romanianResult.token}`);
        } catch (error) {
          console.error("Failed to create tokens for QR codes:", error);
        }
      }
    };
    
    generateTokens();
  }, [createToken]);
  
  // Fetch leads with error handling
  const leads = useQuery(api.leads.getLeads) as DBLead[] | undefined;
  
  const [prevLeadsCount, setPrevLeadsCount] = useState(0);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: '' });
  
  // Use useMemo to create a sorted copy of leads whenever the leads data changes
  const sortedLeads = useMemo(() => {
    if (!leads) return [];
    
    // Create a new sorted array with newest leads first
    try {
      return [...leads].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } catch (err) {
      console.error("Error sorting leads:", err);
      return [];
    }
  }, [leads]);
  
  // Calculate total pages and current page's leads
  const totalPages = useMemo(() => {
    return Math.ceil(sortedLeads.length / leadsPerPage);
  }, [sortedLeads, leadsPerPage]);
  
  // Get current page's leads
  const currentLeads = useMemo(() => {
    const indexOfLastLead = currentPage * leadsPerPage;
    const indexOfFirstLead = indexOfLastLead - leadsPerPage;
    return sortedLeads.slice(indexOfFirstLead, indexOfLastLead);
  }, [sortedLeads, currentPage, leadsPerPage]);
  
  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top of table/cards when page changes
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  
  // Handle loading state
  useEffect(() => {
    // If leads is undefined, we're still loading
    if (leads === undefined) {
      setIsLoading(true);
      
      // Set a timeout to show an error if it takes too long
      const timer = setTimeout(() => {
        setApiError("API connection timed out. The Convex backend might not be available.");
        setIsLoading(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
      setApiError(null);
    }
  }, [leads]);
  
  // This effect will run when leads data changes
  useEffect(() => {
    if (leads && leads.length > prevLeadsCount && prevLeadsCount > 0) {
      // Show notification when a new lead is added
      setNotification({
        show: true,
        message: "New lead added!"
      });
      
      // Hide notification after 5 seconds
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '' });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
    
    if (leads) {
      setPrevLeadsCount(leads.length);
    }
  }, [leads, prevLeadsCount]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {notification.show && (
        <div className="fixed top-4 right-4 bg-primary/90 text-primary-foreground p-4 rounded-md shadow-lg z-50 animate-fade-in-down flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {notification.message}
        </div>
      )}
      
      {/* <header className="border-b border-border/40 bg-card shadow-sm">
        <div className="container mx-auto px-3 py-3 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Cloud className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-base font-semibold leading-tight">Cloud Companion</h1>
              <p className="text-xs text-muted-foreground">Lead Management</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="h-8 px-2">
            <Link href="/">
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Back
            </Link>
          </Button>
        </div>
      </header> */}
      
      <main className="container mx-auto px-2 sm:px-3 py-4 max-w-7xl">
        {/* QR Codes for Language Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* English QR Code */}
          <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 text-center sm:text-left">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                <div className="border border-border/40 rounded-md overflow-hidden shadow-sm h-6 w-9 sm:h-8 sm:w-12">
                  <Image 
                    src="/images/flags/us-flag.svg"
                    alt="US Flag"
                    width={48}
                    height={32}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                English Voice Agent
              </CardTitle>
              <CardDescription>Scan to start a conversation in English</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-4 sm:py-6">
              {englishQRUrl ? (
                <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm">
                  <QRCode 
                    value={englishQRUrl} 
                    size={160}
                    className="sm:w-[300px] sm:h-[300px] w-[300px] h-[300px]"
                  />
                </div>
              ) : (
                <div className="h-[300px] w-[300px] sm:h-[300px] sm:w-[300px] flex items-center justify-center bg-muted/20 rounded-lg">
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Romanian QR Code */}
          <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 text-center sm:text-left">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                <div className="border border-border/40 rounded-md overflow-hidden shadow-sm h-6 w-9 sm:h-8 sm:w-12">
                  <Image 
                    src="/images/flags/romanian-flag.svg"
                    alt="Romanian Flag"
                    width={48}
                    height={32}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                Romanian Voice Agent
              </CardTitle>
              <CardDescription>Scan to start a conversation in Romanian</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center py-4 sm:py-6">
              {romanianQRUrl ? (
                <div className="bg-white p-4 sm:p-5 rounded-lg shadow-sm">
                  <QRCode 
                    value={romanianQRUrl} 
                    size={160}
                    className="sm:w-[300px] sm:h-[300px] w-[300px] h-[300px]"
                  />
                </div>
              ) : (
                <div className="h-[300px] w-[300px] sm:h-[300px] sm:w-[300px] flex items-center justify-center bg-muted/20 rounded-lg">
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Loading leads data...</p>
          </div>
        ) : apiError ? (
          <div className="bg-destructive/10 rounded-lg p-6 mt-8 text-center">
            <h2 className="text-lg font-medium mb-2 text-destructive">Connection Error</h2>
            <p className="text-muted-foreground mb-4">{apiError}</p>
            <Button asChild variant="outline">
              <Link href="/">
                Return to Voice Agent
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Leads table */}
            <Card className="overflow-hidden border-border/40 shadow-sm">
              <CardHeader className="pb-0 pt-6">
                <CardTitle className="text-xl">Qualified Leads</CardTitle>
                <CardDescription>Complete overview of all leads</CardDescription>
              </CardHeader>

              <CardContent className="px-0 py-4">
                <div className="overflow-x-auto md:overflow-visible">
                  {/* Mobile card view for portrait screens (visible on small screens) */}
                  <div className="md:hidden space-y-4 px-4 overflow-y-auto no-scrollbar">
                    {!sortedLeads || sortedLeads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <PieChart className="h-10 w-10 mb-2 text-muted-foreground/50" />
                        <p className="mb-1 font-medium">No leads found</p>
                        <p className="text-sm">Start a conversation with the voice agent to generate leads</p>
                      </div>
                    ) : (
                      currentLeads.map((lead, index) => (
                        <Card key={lead._id} className={cn(
                          "overflow-hidden border-border/30 mx-auto max-w-md",
                          index % 2 === 0 ? "bg-background" : "bg-muted/5"
                        )}>
                          <CardHeader className="p-4 pb-2 text-center">
                            <div className="flex items-center gap-3 justify-center">
                              {lead.language && (
                                <div className="border border-border/40 rounded-md overflow-hidden shadow-sm h-5 w-8">
                                  <Image 
                                    src={`/images/flags/${lead.language === "romanian" ? "romanian-flag.svg" : "us-flag.svg"}`}
                                    alt={`${lead.language === "romanian" ? "Romanian" : "English"} flag`}
                                    width={32}
                                    height={20}
                                    style={{ objectFit: 'cover' }}
                                  />
                                </div>
                              )}
                              <div>
                                <CardTitle className="text-sm font-medium">{lead.name || 'N/A'}</CardTitle>
                                <CardDescription className="text-xs">{new Date(lead.createdAt).toLocaleString()}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Budget</p>
                                <p className="font-medium truncate">{lead.budget || 'Not specified'}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Authority</p>
                                <p className="font-medium truncate">{lead.authority || 'Not specified'}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Need</p>
                                <p className="font-medium truncate">{lead.needs || 'Not specified'}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Timeframe</p>
                                <p className="font-medium truncate">{lead.timeframe || 'Not specified'}</p>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="p-2 border-t border-border/20 flex justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-full text-primary justify-center"
                              onClick={() => {
                                const content = JSON.stringify(lead, null, 2);
                                alert(content);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" /> View Details
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    )}
                  </div>

                  {/* Desktop table view (hidden on small screens) */}
                  <table className="w-full border-collapse hidden md:table text-sm">
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b whitespace-nowrap">
                          Lead / Language
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
                          Budget
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
                          Authority
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
                          Need
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
                          Timeframe
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {!sortedLeads || sortedLeads.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <PieChart className="h-10 w-10 mb-2 text-muted-foreground/50" />
                              <p className="mb-1 font-medium">No leads found</p>
                              <p className="text-sm">Start a conversation with the voice agent to generate leads</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentLeads.map((lead, index) => {
                          const dateAdded = new Date(lead.createdAt).toLocaleString();
                          
                          return (
                            <tr 
                              key={lead._id} 
                              className={cn(
                                "transition-colors hover:bg-muted/20",
                                index % 2 === 0 ? "bg-background" : "bg-muted/5"
                              )}
                              onClick={() => {
                                const content = JSON.stringify(lead, null, 2);
                                alert(content);
                              }}
                              title="Click for details"
                              style={{ cursor: 'pointer' }}
                            >
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="mr-2 h-6 w-6 relative">
                                    {lead.language && (
                                      <div className="border border-border/40 rounded-md overflow-hidden shadow-sm w-6 h-4">
                                        <Image 
                                          src={`/images/flags/${lead.language === "romanian" ? "romanian-flag.svg" : "us-flag.svg"}`}
                                          alt={`${lead.language === "romanian" ? "Romanian" : "English"} flag`}
                                          width={24}
                                          height={16}
                                          style={{ objectFit: 'cover' }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm">
                                      {lead.name || 'N/A'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {dateAdded}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="text-sm max-w-[150px] truncate">
                                  {lead.budget || 'Not specified'}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="text-sm max-w-[150px] truncate">
                                  {lead.authority || 'Not specified'}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="text-sm max-w-[150px] truncate">
                                  {lead.needs || 'Not specified'}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="text-sm max-w-[150px] truncate">
                                  {lead.timeframe || 'Not specified'}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              
              {sortedLeads?.length > 0 && (
                <CardFooter className="border-t border-border/40 py-4 px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-sm text-muted-foreground">
                    Showing {currentLeads.length} of {sortedLeads.length} lead{sortedLeads.length !== 1 ? 's' : ''}
                  </div>
                  
                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        &lt;
                      </Button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Logic to show 5 page buttons centered around current page
                        let pageNum;
                        if (totalPages <= 5) {
                          // If 5 or fewer pages, show all
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          // If near the start, show first 5 pages
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          // If near the end, show last 5 pages
                          pageNum = totalPages - 4 + i;
                        } else {
                          // Show 2 before and 2 after current page
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        &gt;
                      </Button>
                    </div>
                  )}
                </CardFooter>
              )}
            </Card>
          </>
        )}
      
            {/* Stats cards row */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 md:grid-cols-4 mb-6 mt-6">
              {/* Leads count card */}
              <StatCard 
                title="Total Leads" 
                value={leads?.length || 0}
                description="All qualified leads"
                icon={<Users className="h-4 w-4" />}
              />
              
              {/* Budget card */}
              <StatCard 
                title="With Budget" 
                value={leads?.filter(lead => lead.budget && (
                  lead.budget.length > 3 && 
                  // English negative responses
                  !lead.budget.toLowerCase().includes('no') &&
                  !lead.budget.toLowerCase().includes('not') &&
                  !lead.budget.toLowerCase().includes('don\'t') &&
                  !lead.budget.toLowerCase().includes('dont') &&
                  !lead.budget.toLowerCase().includes('not specified') &&
                  // Romanian negative responses
                  !lead.budget.toLowerCase().includes('nu ') &&
                  !lead.budget.toLowerCase().includes('nu am') &&
                  !lead.budget.toLowerCase().includes('fără') &&
                  !lead.budget.toLowerCase().includes('nespecificat')
                )).length || 0}
                description="Leads with defined budget"
                icon={<DollarSign className="h-4 w-4" />}
              />
              
              {/* Authority card */}
              <StatCard 
                title="Decision Makers" 
                value={leads?.filter(lead => {
                  if (!lead.authority) return false;
                  const authority = lead.authority.toLowerCase();
                  // Check for negative responses first and exclude them
                  if (
                    authority.includes('no ') || 
                    authority.includes('not ') || 
                    authority.includes("don't") || 
                    authority.includes("dont") ||
                    authority.includes("cannot") ||
                    authority.includes("can't") ||
                    // Romanian negative responses
                    authority.includes("nu ") ||
                    authority.includes("nu am") ||
                    authority.includes("nu pot") ||
                    authority.includes("nu sunt")
                  ) {
                    return false;
                  }
                  // Then check for positive responses in both English and Romanian
                  return (
                    // English positive responses
                    authority.includes('yes') ||
                    authority.includes('i am') ||
                    authority.includes('i can') ||
                    authority.includes('i do') ||
                    authority.includes('have authority') ||
                    authority.includes('decision maker') ||
                    authority.includes('final say') ||
                    authority.includes('approve') ||
                    // Romanian positive responses
                    authority.includes('da') ||
                    authority.includes('sunt') ||
                    authority.includes('pot') ||
                    authority.includes('eu decid') ||
                    authority.includes('decizie') ||
                    authority.includes('autoritate') ||
                    authority.includes('aprob')
                  );
                }).length || 0}
                description="Leads with authority"
                icon={<UserCheck className="h-4 w-4" />}
              />
              
              {/* Timeframe card */}
              <StatCard 
                title="Urgent Timeframe" 
                value={leads?.filter(lead => lead.timeframe && (
                  // English urgency terms
                  lead.timeframe.toLowerCase().includes('immediate') || 
                  lead.timeframe.toLowerCase().includes('urgent') ||
                  lead.timeframe.toLowerCase().includes('soon') ||
                  lead.timeframe.toLowerCase().includes('next') ||
                  lead.timeframe.toLowerCase().includes('week') ||
                  lead.timeframe.toLowerCase().includes('day') ||
                  lead.timeframe.toLowerCase().includes('asap') ||
                  // Romanian urgency terms
                  lead.timeframe.toLowerCase().includes('imediat') ||
                  lead.timeframe.toLowerCase().includes('urgent') ||
                  lead.timeframe.toLowerCase().includes('curând') ||
                  lead.timeframe.toLowerCase().includes('următor') ||
                  lead.timeframe.toLowerCase().includes('săptămână') ||
                  lead.timeframe.toLowerCase().includes('săptămâni') ||
                  lead.timeframe.toLowerCase().includes('zi') ||
                  lead.timeframe.toLowerCase().includes('zile') ||
                  // Regex for both languages
                  /\d+\s*(day|week|month|zi|zile|săptămână|săptămâni|lună|luni)/i.test(lead.timeframe)
                )).length || 0}
                description="Leads with urgent needs"
                icon={<Clock className="h-4 w-4" />}
              />
            </div>
      </main>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card className="border-border/40 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
        <div>
          <CardTitle className="text-xs sm:text-sm font-medium truncate">{title}</CardTitle>
          <CardDescription className="text-xs truncate">{description}</CardDescription>
        </div>
        <div className="rounded-full bg-primary/10 p-1 sm:p-2 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-3 py-2">
        <div className="text-xl sm:text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
} 