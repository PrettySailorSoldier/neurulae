import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePremium } from "@/contexts/PremiumContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Shield, 
  Plus, 
  Trash2, 
  Edit,
  Calendar, 
  Users, 
  TrendingUp,
  AlertCircle,
  Copy,
  CheckCircle2,
  XCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PromoCode {
  id: string;
  code: string;
  plan_type: string;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

interface PromoRedemption {
  id: string;
  user_id: string;
  redeemed_at: string;
  profiles: {
    email: string;
  };
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { isAdmin, loading } = usePremium();
  const { user } = useAuth();
  const { toast } = useToast();

  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoadingCodes, setIsLoadingCodes] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCodeRedemptions, setSelectedCodeRedemptions] = useState<PromoRedemption[]>([]);
  const [redemptionsDialogOpen, setRedemptionsDialogOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<PromoCode | null>(null);

  // Form state
  const [newCode, setNewCode] = useState("");
  const [planType, setPlanType] = useState<"premium" | "lifetime">("premium");
  const [maxUses, setMaxUses] = useState<string>("");
  const [expiresInDays, setExpiresInDays] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, loading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      loadPromoCodes();
    }
  }, [isAdmin]);

  const loadPromoCodes = async () => {
    setIsLoadingCodes(true);
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error("Error loading promo codes:", error);
      toast({
        title: "Error",
        description: "Failed to load promo codes",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCodes(false);
    }
  };

  const handleCreateCode = async () => {
    if (!newCode.trim()) {
      toast({
        title: "Code Required",
        description: "Please enter a promo code",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const expiresAt = expiresInDays
        ? new Date(Date.now() + parseInt(expiresInDays) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase.from("promo_codes").insert({
        code: newCode.toUpperCase().trim(),
        plan_type: planType,
        max_uses: maxUses ? parseInt(maxUses) : null,
        expires_at: expiresAt,
        active: true,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Promo code "${newCode.toUpperCase()}" created successfully`,
      });

      setNewCode("");
      setMaxUses("");
      setExpiresInDays("");
      setCreateDialogOpen(false);
      loadPromoCodes();
    } catch (error: any) {
      console.error("Error creating promo code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create promo code",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .update({ active: !currentActive })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: currentActive ? "Code Deactivated" : "Code Activated",
        description: `Promo code has been ${currentActive ? "deactivated" : "activated"}`,
      });

      loadPromoCodes();
    } catch (error) {
      console.error("Error toggling promo code:", error);
      toast({
        title: "Error",
        description: "Failed to update promo code",
        variant: "destructive",
      });
    }
  };

  const handleUpdateExpiration = async (id: string, daysToAdd: number) => {
    try {
      const newExpiration = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from("promo_codes")
        .update({ expires_at: newExpiration })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Expiration Updated",
        description: `Expiration set to ${daysToAdd} days from now`,
      });

      loadPromoCodes();
    } catch (error) {
      console.error("Error updating expiration:", error);
      toast({
        title: "Error",
        description: "Failed to update expiration",
        variant: "destructive",
      });
    }
  };

  const handleViewRedemptions = async (codeId: string) => {
    try {
      const { data, error } = await supabase
        .from("promo_redemptions")
        .select(`
          id,
          user_id,
          redeemed_at,
          profiles:user_id (
            email
          )
        `)
        .eq("promo_code_id", codeId)
        .order("redeemed_at", { ascending: false });

      if (error) throw error;

      setSelectedCodeRedemptions(data as any || []);
      setRedemptionsDialogOpen(true);
    } catch (error) {
      console.error("Error loading redemptions:", error);
      toast({
        title: "Error",
        description: "Failed to load redemption history",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCode = async () => {
    if (!selectedCode) return;

    try {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", selectedCode.id);

      if (error) throw error;

      toast({
        title: "Code Deleted",
        description: `Promo code "${selectedCode.code}" has been deleted`,
      });

      setDeleteDialogOpen(false);
      setSelectedCode(null);
      loadPromoCodes();
    } catch (error) {
      console.error("Error deleting promo code:", error);
      toast({
        title: "Error",
        description: "Failed to delete promo code",
        variant: "destructive",
      });
    }
  };

  const handleEditCode = async () => {
    if (!selectedCode) return;

    setIsCreating(true);
    try {
      const expiresAt = expiresInDays
        ? new Date(Date.now() + parseInt(expiresInDays) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from("promo_codes")
        .update({
          plan_type: planType,
          max_uses: maxUses ? parseInt(maxUses) : null,
          expires_at: expiresAt,
        })
        .eq("id", selectedCode.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Promo code "${selectedCode.code}" updated successfully`,
      });

      setEditDialogOpen(false);
      setSelectedCode(null);
      setMaxUses("");
      setExpiresInDays("");
      loadPromoCodes();
    } catch (error: any) {
      console.error("Error updating promo code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update promo code",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const openEditDialog = (code: PromoCode) => {
    setSelectedCode(code);
    setPlanType(code.plan_type as "premium" | "lifetime");
    setMaxUses(code.max_uses?.toString() || "");
    
    // Calculate days until expiration if exists
    if (code.expires_at) {
      const daysUntil = Math.ceil((new Date(code.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      setExpiresInDays(daysUntil > 0 ? daysUntil.toString() : "");
    } else {
      setExpiresInDays("");
    }
    
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (code: PromoCode) => {
    setSelectedCode(code);
    setDeleteDialogOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Promo code copied to clipboard",
    });
  };

  const getStatusBadge = (code: PromoCode) => {
    const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
    const isMaxedOut = code.max_uses !== null && code.current_uses >= code.max_uses;

    if (!code.active) {
      return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" />Inactive</Badge>;
    }
    if (isExpired) {
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Expired</Badge>;
    }
    if (isMaxedOut) {
      return <Badge variant="destructive" className="gap-1"><Users className="h-3 w-3" />Max Uses</Badge>;
    }
    return <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Active</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Panel</h1>
          </div>
          <Button onClick={() => navigate("/")}>Back to App</Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{promoCodes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {promoCodes.filter(c => c.active && (!c.expires_at || new Date(c.expires_at) > new Date())).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Redemptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {promoCodes.reduce((sum, code) => sum + code.current_uses, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Promo Codes Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Promo Codes</CardTitle>
                <CardDescription>Create and manage promotional codes</CardDescription>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Code
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingCodes ? (
              <p className="text-center py-8 text-muted-foreground">Loading codes...</p>
            ) : promoCodes.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No promo codes yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{code.code}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(code.code)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{code.plan_type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(code)}</TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          onClick={() => handleViewRedemptions(code.id)}
                          className="p-0 h-auto"
                        >
                          {code.current_uses} / {code.max_uses ?? "∞"}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {code.expires_at ? (
                          <span className="text-sm">
                            {new Date(code.expires_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={code.active}
                            onCheckedChange={() => handleToggleActive(code.id, code.active)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(code)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(code)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Code Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Promo Code</DialogTitle>
            <DialogDescription>
              Create a new promotional code for your testers or users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                placeholder="e.g., TESTER2025"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Plan Type</Label>
              <Select value={planType} onValueChange={(v: any) => setPlanType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-uses">Max Uses (optional)</Label>
              <Input
                id="max-uses"
                type="number"
                placeholder="Leave empty for unlimited"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires">Expires In (days, optional)</Label>
              <Input
                id="expires"
                type="number"
                placeholder="Leave empty for never expires"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCode} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Code Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Promo Code</DialogTitle>
            <DialogDescription>
              Update the settings for "{selectedCode?.code}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">Code</Label>
              <Input
                id="edit-code"
                value={selectedCode?.code || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Code cannot be changed after creation</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-plan">Plan Type</Label>
              <Select value={planType} onValueChange={(v: any) => setPlanType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-max-uses">Max Uses (optional)</Label>
              <Input
                id="edit-max-uses"
                type="number"
                placeholder="Leave empty for unlimited"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expires">Expires In (days from now, optional)</Label>
              <Input
                id="edit-expires"
                type="number"
                placeholder="Leave empty for never expires"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCode} disabled={isCreating}>
              {isCreating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Promo Code</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCode?.code}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCode}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redemptions Dialog */}
      <Dialog open={redemptionsDialogOpen} onOpenChange={setRedemptionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Redemption History</DialogTitle>
            <DialogDescription>
              Users who have redeemed this promo code
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {selectedCodeRedemptions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No redemptions yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Redeemed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCodeRedemptions.map((redemption) => (
                    <TableRow key={redemption.id}>
                      <TableCell>{redemption.profiles?.email || "Unknown"}</TableCell>
                      <TableCell>{new Date(redemption.redeemed_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
