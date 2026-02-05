import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import PageContainer from '@/components/layout/page-container';

export default function ProfileViewPage() {
  return (
    <PageContainer>
      <div className='space-y-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Profile</h2>
          <p className='text-muted-foreground'>
            Manage your account settings and preferences.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your personal account details and settings.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Name</label>
                <p className='text-muted-foreground text-sm'>John Doe</p>
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Email</label>
                <p className='text-muted-foreground text-sm'>
                  john@example.com
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Customize your dashboard experience.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground text-sm'>
              Add your preference settings here.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
