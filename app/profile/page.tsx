"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Mail, Phone, Building, Upload, Loader2, Lock, Shield, Eye, EyeOff } from "lucide-react"
import { PhotoEditorModal } from "@/components/profile/photo-editor-modal"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  email: string
  name: string
  photo_url?: string
  phone?: string
  bio?: string
  company?: string
  role: string
  created_at: string
}

interface NotificationSettings {
  email_reservations: boolean
  email_payments: boolean
  email_maintenance: boolean
  email_marketing: boolean
  sms_reservations: boolean
  sms_payments: boolean
}

interface PreferenceSettings {
  timezone: string
  language: string
  currency: string
  date_format: string
}

export default function ProfilePage() {
  console.log("[v0] ProfilePage component mounted")
  const router = useRouter()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    company: "",
  })

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_reservations: true,
    email_payments: true,
    email_maintenance: true,
    email_marketing: false,
    sms_reservations: false,
    sms_payments: false,
  })

  const [preferences, setPreferences] = useState<PreferenceSettings>({
    timezone: "America/New_York",
    language: "en",
    currency: "USD",
    date_format: "MM/DD/YYYY",
  })

  const [showPhotoEditor, setShowPhotoEditor] = useState(false)
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null)

  const fetchProfile = useCallback(async () => {
    console.log("[v0] Fetching profile from /api/user/profile")
    try {
      const response = await fetch("/api/user/profile")
      console.log("[v0] Profile API response status:", response.status)

      if (!response.ok) {
        console.error("[v0] Profile fetch failed with status:", response.status)
        throw new Error("Failed to fetch profile")
      }

      const data = await response.json()
      console.log("[v0] Profile data received:", data)
      setProfile(data)
      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        bio: data.bio || "",
        company: data.company || "",
      })
    } catch (error) {
      console.error("[v0] Error fetching profile:", error)
      setError("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    console.log("[v0] ProfilePage useEffect running, fetching profile data")
    fetchProfile()
  }, [fetchProfile])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[v0] handlePhotoUpload called")
    const file = e.target.files?.[0]
    if (!file) {
      console.log("[v0] No file selected")
      return
    }

    console.log("[v0] File selected:", file.name, file.type, file.size)

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB")
      return
    }

    console.log("[v0] Opening photo editor modal")
    setSelectedPhotoFile(file)
    setShowPhotoEditor(true)
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        window.dispatchEvent(new CustomEvent("profile-updated", { detail: updatedProfile }))
      }
    } catch (error) {
      console.error("Failed to update profile:", error)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] handlePasswordChange called")
    console.log("[v0] Password data:", {
      current: passwordData.current_password ? "***" : "empty",
      new: passwordData.new_password ? "***" : "empty",
      confirm: passwordData.confirm_password ? "***" : "empty",
      match: passwordData.new_password === passwordData.confirm_password,
    })

    if (passwordData.new_password !== passwordData.confirm_password) {
      console.log("[v0] Passwords don't match, showing toast")
      toast({
        title: "Passwords Don't Match",
        description: "The new password and confirmation password must match.",
        variant: "destructive",
      })
      return
    }

    if (passwordData.new_password.length < 8) {
      console.log("[v0] Password too short, showing toast")
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] Password validation passed, calling API")
    setSaving(true)
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("[v0] Non-JSON response received:", await response.text())
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        })
        return
      }

      const data = await response.json()

      if (response.ok) {
        setPasswordData({ current_password: "", new_password: "", confirm_password: "" })
        toast({
          title: "Password Changed",
          description: "Your password has been successfully updated.",
        })
      } else {
        toast({
          title: "Password Change Failed",
          description: data.error || "Failed to change password",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Failed to change password:", error)
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationSave = async () => {
    setSaving(true)
    try {
      // TODO: Implement notification settings API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert("Notification settings saved")
    } catch (error) {
      console.error("Failed to save notifications:", error)
    } finally {
      setSaving(false)
    }
  }

  const handlePreferencesSave = async () => {
    setSaving(true)
    try {
      // TODO: Implement preferences API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      alert("Preferences saved")
    } catch (error) {
      console.error("Failed to save preferences:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEditedPhoto = async (editedBlob: Blob) => {
    try {
      setUploading(true)
      console.log("[v0] Starting edited photo upload")

      const formData = new FormData()
      formData.append("file", editedBlob, "profile-photo.jpg")

      const uploadResponse = await fetch("/api/user/upload-photo", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        console.error("[v0] Failed to upload photo:", error)
        throw new Error(error.error || "Failed to upload photo")
      }

      const { url } = await uploadResponse.json()
      console.log("[v0] Photo uploaded successfully:", url)

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_url: url }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("[v0] Failed to update profile:", error)
        throw new Error(error.error || "Failed to update profile")
      }

      const updatedProfile = await response.json()
      console.log("[v0] Profile updated with new photo:", updatedProfile.photo_url)
      setProfile(updatedProfile)
      window.dispatchEvent(new CustomEvent("profile-updated", { detail: updatedProfile }))

      setShowPhotoEditor(false)
      setSelectedPhotoFile(null)
    } catch (error) {
      console.error("[v0] Failed to upload photo:", error)
      alert("Failed to upload photo. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    console.log("[v0] ProfilePage rendering loading state")
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    console.log("[v0] ProfilePage rendering error state:", error)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    console.log("[v0] ProfilePage: No profile data available")
    return null
  }

  console.log("[v0] ProfilePage rendering main content for user:", profile.email)

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Profile Photo</CardTitle>
                <CardDescription>Update your profile picture</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile.photo_url || "/placeholder.svg"} alt={profile.name} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <div className="w-full">
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => {
                      console.log("[v0] Upload Photo button clicked")
                      document.getElementById("photo-upload")?.click()
                    }}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Photo
                      </>
                    )}
                  </Button>
                </div>
                <div className="w-full space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="capitalize">{profile.role}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Your company name"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  </div>

                  <Button type="submit" disabled={saving} className="w-full">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>View your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email Address</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Account Type</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{profile.role}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Member Since</Label>
                  <span>{new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Account ID</Label>
                  <span className="font-mono text-sm">{profile.id.slice(0, 8)}...</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="current_password"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      placeholder="Enter current password"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new_password"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      placeholder="Enter new password"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Must be at least 8 characters long</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm_password"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      placeholder="Confirm new password"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="destructive" disabled>
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Manage your email notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email_reservations">Reservation Updates</Label>
                  <p className="text-sm text-muted-foreground">Get notified about new reservations and changes</p>
                </div>
                <Switch
                  id="email_reservations"
                  checked={notifications.email_reservations}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email_reservations: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email_payments">Payment Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive alerts for payments and invoices</p>
                </div>
                <Switch
                  id="email_payments"
                  checked={notifications.email_payments}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email_payments: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email_maintenance">Maintenance Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified about property maintenance issues</p>
                </div>
                <Switch
                  id="email_maintenance"
                  checked={notifications.email_maintenance}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email_maintenance: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email_marketing">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">Receive updates about new features and tips</p>
                </div>
                <Switch
                  id="email_marketing"
                  checked={notifications.email_marketing}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email_marketing: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SMS Notifications</CardTitle>
              <CardDescription>Manage your SMS notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sms_reservations">Reservation Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get SMS alerts for urgent reservation updates</p>
                </div>
                <Switch
                  id="sms_reservations"
                  checked={notifications.sms_reservations}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, sms_reservations: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sms_payments">Payment Alerts</Label>
                  <p className="text-sm text-muted-foreground">Receive SMS for payment confirmations</p>
                </div>
                <Switch
                  id="sms_payments"
                  checked={notifications.sms_payments}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, sms_payments: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleNotificationSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Notification Settings"
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>Customize your regional preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={preferences.timezone}
                  onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={preferences.language}
                  onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ja">日本語</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={preferences.currency}
                  onValueChange={(value) => setPreferences({ ...preferences, currency: value })}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_format">Date Format</Label>
                <Select
                  value={preferences.date_format}
                  onValueChange={(value) => setPreferences({ ...preferences, date_format: value })}
                >
                  <SelectTrigger id="date_format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handlePreferencesSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 rounded-lg border p-4">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-medium">Two-factor authentication is not enabled</p>
                  <p className="text-sm text-muted-foreground">
                    Protect your account with an additional security layer
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Enable 2FA
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active login sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">{new Date().toLocaleString()}</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Revoke
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
              <CardDescription>Recent login activity on your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex-1">
                    <p className="font-medium">Successful login</p>
                    <p className="text-muted-foreground">{new Date().toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PhotoEditorModal
        open={showPhotoEditor}
        onClose={() => {
          console.log("[v0] Photo editor modal closed")
          setShowPhotoEditor(false)
          setSelectedPhotoFile(null)
        }}
        imageFile={selectedPhotoFile}
        onSave={handleSaveEditedPhoto}
      />
    </div>
  )
}
