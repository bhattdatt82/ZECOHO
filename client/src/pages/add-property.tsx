import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertPropertySchema, type Amenity, type CategorizedPropertyImages } from "@shared/schema";
import { z } from "zod";
import { AddressInput, type AddressDetails } from "@/components/AddressInput";
import { 
  PropertyImageUploader, 
  getImagesArrayFromCategorized,
  defaultCategorizedImages 
} from "@/components/PropertyImageUploader";

const formSchema = insertPropertySchema.extend({
  images: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof formSchema>;

export default function AddProperty() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [categorizedImages, setCategorizedImages] = useState<CategorizedPropertyImages>(defaultCategorizedImages);
  const [propertyAddress, setPropertyAddress] = useState<AddressDetails>({
    fullAddress: "",
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyType: "hotel",
      status: "pending",
      images: [],
      videos: [],
      maxGuests: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
    },
  });

  const propertyType = watch("propertyType");

  const { data: amenities = [] } = useQuery<Amenity[]>({
    queryKey: ["/api/amenities"],
  });

  const getTotalImageCount = () => {
    return Object.values(categorizedImages).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  };

  const createPropertyMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/properties", {
        ...data,
        amenityIds: selectedAmenities,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Property submitted for review. You'll be notified once it's approved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/properties"] });
      setLocation("/owner/properties");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create property",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const allImages = getImagesArrayFromCategorized(categorizedImages);
    if (allImages.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload at least one property image",
        variant: "destructive",
      });
      return;
    }
    
    createPropertyMutation.mutate({
      ...data,
      images: allImages,
      categorizedImages: categorizedImages,
      videos: videos.length > 0 ? videos : data.videos,
      address: propertyAddress.fullAddress || data.address,
      latitude: propertyAddress.latitude || data.latitude,
      longitude: propertyAddress.longitude || data.longitude,
    });
  };

  return (
    <div className="min-h-screen pb-16">
      <div className="container px-4 md:px-6 py-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Add new property</h1>
          <p className="text-muted-foreground">
            Step {step} of {totalSteps}
          </p>
          <div className="mt-4 flex gap-2">
            {[...Array(totalSteps)].map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i < step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Property title *</Label>
                    <Input
                      id="title"
                      {...register("title")}
                      placeholder="Beautiful villa with ocean view"
                      data-testid="input-title"
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="propertyType">Property type *</Label>
                    <Select
                      value={propertyType}
                      onValueChange={(value) => setValue("propertyType", value as any)}
                    >
                      <SelectTrigger data-testid="select-property-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hotel">Hotel</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="cabin">Cabin</SelectItem>
                        <SelectItem value="resort">Resort</SelectItem>
                        <SelectItem value="hostel">Hostel</SelectItem>
                        <SelectItem value="lodge">Lodge</SelectItem>
                        <SelectItem value="cottage">Cottage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="destination">Property Location *</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Search for your address or enter it manually
                    </p>
                    <AddressInput
                      value={propertyAddress}
                      onChange={(address) => {
                        setPropertyAddress(address);
                        setValue("destination", address.city || address.locality || address.district || "");
                        setValue("address", address.fullAddress);
                      }}
                      placeholder="Search for your property address..."
                      testIdPrefix="property-address"
                    />
                    {errors.destination && (
                      <p className="text-sm text-destructive mt-1">{errors.destination.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      placeholder="Describe your property..."
                      rows={5}
                      data-testid="textarea-description"
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="button" onClick={() => setStep(2)} data-testid="button-next-step">
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxGuests">Max guests *</Label>
                      <Input
                        id="maxGuests"
                        type="number"
                        {...register("maxGuests", { valueAsNumber: true })}
                        min="1"
                        data-testid="input-max-guests"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bedrooms">Bedrooms *</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        {...register("bedrooms", { valueAsNumber: true })}
                        min="1"
                        data-testid="input-bedrooms"
                      />
                    </div>
                    <div>
                      <Label htmlFor="beds">Beds *</Label>
                      <Input
                        id="beds"
                        type="number"
                        {...register("beds", { valueAsNumber: true })}
                        min="1"
                        data-testid="input-beds"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bathrooms">Bathrooms *</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        {...register("bathrooms", { valueAsNumber: true })}
                        min="1"
                        data-testid="input-bathrooms"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="pricePerNight">Price per night (INR) *</Label>
                    <Input
                      id="pricePerNight"
                      type="number"
                      {...register("pricePerNight", { valueAsNumber: true })}
                      step="0.01"
                      min="0"
                      placeholder="10000.00"
                      data-testid="input-price"
                    />
                    {errors.pricePerNight && (
                      <p className="text-sm text-destructive mt-1">{errors.pricePerNight.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="policies">House rules</Label>
                    <Textarea
                      id="policies"
                      {...register("policies")}
                      placeholder="Check-in after 3pm, No smoking, etc."
                      rows={3}
                      data-testid="textarea-policies"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Amenities</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select all amenities that your property offers
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {amenities.map((amenity) => (
                      <div key={amenity.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity.id}
                          checked={selectedAmenities.includes(amenity.id)}
                          onCheckedChange={(checked) => {
                            setSelectedAmenities(
                              checked
                                ? [...selectedAmenities, amenity.id]
                                : selectedAmenities.filter((id) => id !== amenity.id)
                            );
                          }}
                          data-testid={`checkbox-amenity-${amenity.name.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                        <label
                          htmlFor={amenity.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {amenity.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="button" onClick={() => setStep(3)} data-testid="button-next-step-2">
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <PropertyImageUploader
                value={categorizedImages}
                onChange={setCategorizedImages}
                onVideosChange={setVideos}
                videos={videos}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Submit for Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Admin Approval Required</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Your property will be submitted for admin review. Once approved, it will be visible to all guests on ZECOHO. 
                      You'll be notified when the review is complete.
                    </p>
                  </div>
                  {getTotalImageCount() === 0 && (
                    <p className="text-sm text-destructive">Please upload at least one property image</p>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPropertyMutation.isPending || getTotalImageCount() === 0}
                  data-testid="button-submit-property"
                >
                  {createPropertyMutation.isPending ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
