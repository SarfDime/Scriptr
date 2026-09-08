const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params

  return (
    <div>
      <h1>{slug}</h1>
      <p>Content for {slug}</p>
    </div>
  )
}
export default Page
